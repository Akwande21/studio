const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const upload = multer();

const supabase = createClient('https://your-project.supabase.co', 'your-supabase-service-key');

app.post('/upload', upload.single('file'), async (req, res) => {
  const { subject, grade, year } = req.body;
  const file = req.file;

  if (!file) return res.status(400).send('No file uploaded');

  const fileName = `${Date.now()}-${file.originalname}`;

  // Upload to Supabase Storage
  const { data, error: uploadError } = await supabase
    .storage
    .from('question-papers')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) return res.status(500).send(uploadError.message);

  // Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('question-papers')
    .getPublicUrl(fileName);

  // Save metadata to database
  const { error: dbError } = await supabase
    .from('papers')
    .insert({
      file_name: file.originalname,
      subject,
      grade,
      year: parseInt(year),
      file_url: publicUrlData.publicUrl,
    });

  if (dbError) return res.status(500).send(dbError.message);

  res.status(200).send({
    message: 'Uploaded successfully!',
    file_url: publicUrlData.publicUrl,
  });
});
app.get('/papers', async (req, res) => {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) return res.status(500).send(error.message);
  res.status(200).json(data);
});
app.listen(3000, () => console.log('API running on http://localhost:3000'));