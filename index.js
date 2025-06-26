
const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'your-supabase-service-key'
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Upload paper endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, description, level, subject, year, grade, uploaderId } = req.body;
    const file = req.file;

    // Validation
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    if (!title || !level || !subject || !year || !uploaderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, level, subject, year, uploaderId'
      });
    }

    // Validate year
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear() + 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year provided'
      });
    }

    // Validate educational level
    const validLevels = ['High School', 'College', 'NCV', 'NATED', 'University'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid educational level provided'
      });
    }

    // Validate high school grade requirement
    if (level === 'High School' && !grade) {
      return res.status(400).json({
        success: false,
        message: 'Grade is required for High School level papers'
      });
    }

    // Validate university requirements
    const { universityYear, universityType } = req.body;
    if (level === 'University' && (!universityYear || !universityType)) {
      return res.status(400).json({
        success: false,
        message: 'University year and type are required for University level papers'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${timestamp}_${sanitizedTitle}.pdf`;
    const filePath = `papers/${uploaderId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('question-papers')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to storage',
        error: uploadError.message
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('question-papers')
      .getPublicUrl(filePath);

    // Prepare paper metadata
    const paperData = {
      title,
      description: description || null,
      level,
      subject,
      year: yearNum,
      grade: level === 'High School' ? grade : null,
      university_year: level === 'University' ? universityYear : null,
      university_type: level === 'University' ? universityType : null,
      file_name: file.originalname,
      file_path: filePath,
      file_url: publicUrlData.publicUrl,
      uploader_id: uploaderId,
      file_size: file.size,
      average_rating: 0,
      ratings_count: 0,
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('papers')
      .insert(paperData)
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Cleanup: remove uploaded file if database insert fails
      await supabase.storage.from('question-papers').remove([filePath]);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to save paper metadata',
        error: dbError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Paper uploaded successfully!',
      paper: {
        id: dbData.id,
        title: dbData.title,
        level: dbData.level,
        subject: dbData.subject,
        year: dbData.year,
        grade: dbData.grade,
        university_year: dbData.university_year,
        university_type: dbData.university_type,
        file_url: dbData.file_url,
        uploaded_at: dbData.uploaded_at
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during upload',
      error: error.message
    });
  }
});

// Get papers endpoint with filtering
app.get('/papers', async (req, res) => {
  try {
    const { level, subject, year, grade, universityYear, universityType, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('papers')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (level) query = query.eq('level', level);
    if (subject) query = query.ilike('subject', `%${subject}%`);
    if (year) query = query.eq('year', parseInt(year));
    if (grade) query = query.eq('grade', grade);
    if (universityYear) query = query.eq('university_year', universityYear);
    if (universityType) query = query.eq('university_type', universityType);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch papers',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      papers: data || [],
      total: count,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Get papers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get single paper endpoint
app.get('/papers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('papers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Paper not found'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch paper',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      paper: data
    });

  } catch (error) {
    console.error('Get paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete paper endpoint (admin only)
app.delete('/papers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uploaderId } = req.body;

    if (!uploaderId) {
      return res.status(400).json({
        success: false,
        message: 'Uploader ID is required'
      });
    }

    // Get paper details first
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('file_path, uploader_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    // Check if user owns the paper or is admin (basic check)
    if (paper.uploader_id !== uploaderId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this paper'
      });
    }

    // Delete file from storage
    if (paper.file_path) {
      const { error: storageError } = await supabase
        .storage
        .from('question-papers')
        .remove([paper.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('papers')
      .delete()
      .eq('id', id);

    if (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete paper from database',
        error: dbError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Paper deleted successfully'
    });

  } catch (error) {
    console.error('Delete paper error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed'
    });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paper upload server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
});

module.exports = app;
