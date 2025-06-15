
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Operator = '+' | '-' | '×' | '÷' | 'xʸ';
type UnaryOperationType = 'sqrt' | '1/x' | 'x²' | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'log' | 'ln' | '10ˣ' | 'eˣ';
type MemoryOperationType = 'MC' | 'MR' | 'M+' | 'Min';
type ConstantType = 'π';


export function ScientificCalculator() {
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [memoryValue, setMemoryValue] = useState<number>(0);

  const processInput = (currentDisplay: string): number | null => {
    const num = parseFloat(currentDisplay);
    if (isNaN(num)) {
      showError();
      return null;
    }
    return num;
  };
  
  const updateDisplay = (value: number | string) => {
    const stringValue = String(value);
    // Basic check to prevent overly long strings, can be made more sophisticated
    if (stringValue.length > 15 && Number(value) !== Math.PI && Number(value) !== Math.E) {
        if (Math.abs(Number(value)) > 1e15 || (Math.abs(Number(value)) < 1e-5 && Number(value) !== 0) ) {
             setDisplayValue(Number(value).toExponential(9));
        } else {
            setDisplayValue(Number(value).toPrecision(10));
        }
    } else {
        setDisplayValue(stringValue);
    }
  };


  const inputDigit = (digit: string) => {
    if (hasError) {
      clearAll(); // Clears error state as well
      updateDisplay(digit);
      return;
    }
    if (waitingForOperand) {
      updateDisplay(digit);
      setWaitingForOperand(false);
    } else {
      updateDisplay(displayValue === "0" ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (hasError) return;
    if (waitingForOperand) {
      updateDisplay("0.");
      setWaitingForOperand(false);
    } else if (!displayValue.includes(".")) {
      updateDisplay(displayValue + ".");
    }
  };

  const clearAll = () => {
    updateDisplay("0");
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHasError(false);
  };
  
  const backspace = () => {
    if (hasError) {
      clearAll();
      return;
    }
    if (displayValue.length > 1) {
      updateDisplay(displayValue.slice(0, -1));
    } else if (displayValue !== "0") {
      updateDisplay("0");
    }
  }

  const toggleSign = () => {
    if (hasError || displayValue === "0") return;
    const numericValue = processInput(displayValue);
    if (numericValue === null) return;
    updateDisplay(numericValue * -1);
  };

  const inputPercent = () => {
    if (hasError) return;
    const numericValue = processInput(displayValue);
    if (numericValue === null) return;
    updateDisplay(numericValue / 100);
    // Percentage usually finalizes the number for simple calculators
    // For chained ops like "100 + 10%", behavior can vary. Keeping it simple.
    setWaitingForOperand(true); 
  };

  const performOperation = (nextOperator: Operator) => {
    if (hasError) return;
    const inputValue = processInput(displayValue);
    if (inputValue === null) return;

    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = calculate(currentValue, inputValue, operator);
      if (result === null || !isFinite(result)) {
        showError();
        return;
      }
      updateDisplay(result);
      setCurrentValue(result);
    }
    
    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    if (hasError) return;
    const inputValue = processInput(displayValue);
    if (inputValue === null) return;

    if (currentValue !== null && operator) {
      const result = calculate(currentValue, inputValue, operator);
      if (result === null || !isFinite(result)) {
        showError();
        return;
      }
      updateDisplay(result);
      setCurrentValue(result); 
      setOperator(null); 
      setWaitingForOperand(true); 
    }
  };
  
  const showError = () => {
    updateDisplay("Error");
    setHasError(true);
    setCurrentValue(null);
    setOperator(null);
  }

  const calculate = (val1: number, val2: number, op: Operator): number | null => {
    switch (op) {
      case '+': return val1 + val2;
      case '-': return val1 - val2;
      case '×': return val1 * val2;
      case '÷':
        if (val2 === 0) return null; 
        return val1 / val2;
      case 'xʸ': return Math.pow(val1, val2);
      default: return null;
    }
  };

  const handleUnaryOperation = (operation: UnaryOperationType) => {
    if (hasError) return;
    const inputValue = processInput(displayValue);
    if (inputValue === null) return;
    let result: number | null = null;

    switch (operation) {
      case 'sqrt': result = inputValue < 0 ? null : Math.sqrt(inputValue); break;
      case '1/x': result = inputValue === 0 ? null : 1 / inputValue; break;
      case 'x²': result = Math.pow(inputValue, 2); break;
      case 'sin': result = Math.sin(inputValue); break; // Assumes radians
      case 'cos': result = Math.cos(inputValue); break; // Assumes radians
      case 'tan': result = Math.tan(inputValue); break; // Assumes radians
      case 'asin': result = (inputValue < -1 || inputValue > 1) ? null : Math.asin(inputValue); break;
      case 'acos': result = (inputValue < -1 || inputValue > 1) ? null : Math.acos(inputValue); break;
      case 'atan': result = Math.atan(inputValue); break;
      case 'log': result = inputValue <= 0 ? null : Math.log10(inputValue); break;
      case 'ln': result = inputValue <= 0 ? null : Math.log(inputValue); break;
      case '10ˣ': result = Math.pow(10, inputValue); break;
      case 'eˣ': result = Math.exp(inputValue); break;
      default: break;
    }

    if (result === null || !isFinite(result)) {
      showError();
    } else {
      updateDisplay(result);
      setWaitingForOperand(true);
    }
  };

  const handleMemoryOperation = (operation: MemoryOperationType) => {
    if (hasError && operation !== 'MC') return; // Allow MC even if error
    const currentDisplayNumber = parseFloat(displayValue); // No error check here, M+ M- might work with error display if needed

    switch (operation) {
      case 'MC':
        setMemoryValue(0);
        if (hasError) clearAll(); // Clear error if MC is pressed
        break;
      case 'MR':
        if (hasError) clearAll();
        updateDisplay(memoryValue);
        setWaitingForOperand(true);
        break;
      case 'M+':
        if (!hasError && !isNaN(currentDisplayNumber)) {
          setMemoryValue(memoryValue + currentDisplayNumber);
        }
        break;
      case 'Min': // Store current display value in memory
        if (!hasError && !isNaN(currentDisplayNumber)) {
          setMemoryValue(currentDisplayNumber);
        }
        break;
    }
  };

  const insertConstant = (constant: ConstantType) => {
    if (hasError) clearAll();
    switch (constant) {
      case 'π':
        updateDisplay(Math.PI);
        break;
    }
    setWaitingForOperand(true);
  };


  const buttons: Array<{ label: string, action: () => void, className?: string, type?: string, span?: number }> = [
    // Memory Row
    { label: 'MC', action: () => handleMemoryOperation('MC'), className: "bg-muted hover:bg-muted/80" },
    { label: 'MR', action: () => handleMemoryOperation('MR'), className: "bg-muted hover:bg-muted/80" },
    { label: 'M+', action: () => handleMemoryOperation('M+'), className: "bg-muted hover:bg-muted/80" },
    { label: 'Min', action: () => handleMemoryOperation('Min'), className: "bg-muted hover:bg-muted/80" }, // M- or Store

    // Scientific Functions Row 1
    { label: 'sin', action: () => handleUnaryOperation('sin'), className: "bg-muted hover:bg-muted/80" },
    { label: 'cos', action: () => handleUnaryOperation('cos'), className: "bg-muted hover:bg-muted/80" },
    { label: 'tan', action: () => handleUnaryOperation('tan'), className: "bg-muted hover:bg-muted/80" },
    { label: 'π', action: () => insertConstant('π'), className: "bg-accent/20 hover:bg-accent/40" },
    
    // Scientific Functions Row 2
    { label: 'asin', action: () => handleUnaryOperation('asin'), className: "bg-muted hover:bg-muted/80" },
    { label: 'acos', action: () => handleUnaryOperation('acos'), className: "bg-muted hover:bg-muted/80" },
    { label: 'atan', action: () => handleUnaryOperation('atan'), className: "bg-muted hover:bg-muted/80" },
    { label: 'xʸ', action: () => performOperation('xʸ'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },

    // Scientific Functions Row 3
    { label: 'x²', action: () => handleUnaryOperation('x²'), className: "bg-muted hover:bg-muted/80" },
    { label: '√', action: () => handleUnaryOperation('sqrt'), className: "bg-muted hover:bg-muted/80" },
    { label: '1/x', action: () => handleUnaryOperation('1/x'), className: "bg-muted hover:bg-muted/80" },
    { label: '←', action: backspace, className: "bg-muted hover:bg-muted/80" },

    // Scientific Functions Row 4
    { label: 'log₁₀', action: () => handleUnaryOperation('log'), className: "bg-muted hover:bg-muted/80" },
    { label: 'ln', action: () => handleUnaryOperation('ln'), className: "bg-muted hover:bg-muted/80" },
    { label: '10ˣ', action: () => handleUnaryOperation('10ˣ'), className: "bg-muted hover:bg-muted/80" },
    { label: 'eˣ', action: () => handleUnaryOperation('eˣ'), className: "bg-muted hover:bg-muted/80" },

    // Control and Basic Ops Row
    { label: 'AC', action: clearAll, className: "bg-destructive/80 hover:bg-destructive/90 text-destructive-foreground" },
    { label: '±', action: toggleSign, className: "bg-muted hover:bg-muted/80" },
    { label: '%', action: inputPercent, className: "bg-muted hover:bg-muted/80" },
    { label: '÷', action: () => performOperation('÷'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },
    
    // Digits and Ops
    { label: '7', action: () => inputDigit('7') },
    { label: '8', action: () => inputDigit('8') },
    { label: '9', action: () => inputDigit('9') },
    { label: '×', action: () => performOperation('×'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },

    { label: '4', action: () => inputDigit('4') },
    { label: '5', action: () => inputDigit('5') },
    { label: '6', action: () => inputDigit('6') },
    { label: '–', action: () => performOperation('-'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },

    { label: '1', action: () => inputDigit('1') },
    { label: '2', action: () => inputDigit('2') },
    { label: '3', action: () => inputDigit('3') },
    { label: '+', action: () => performOperation('+'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },

    { label: '0', action: () => inputDigit('0'), span: 2 },
    { label: '.', action: inputDecimal },
    { label: '=', action: handleEquals, className: "bg-green-500 hover:bg-green-600 text-white" },
  ];


  return (
    <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md shadow-2xl border-border">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-center font-mono tracking-wider">Scientific Calculator</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Input
            type="text"
            value={displayValue}
            readOnly
            className="h-16 text-3xl sm:text-4xl text-right bg-muted/30 dark:bg-muted/50 border-2 border-input mb-4 font-mono rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Calculator display"
        />
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn.label}
              onClick={btn.action}
              variant={btn.type === 'digit' || btn.type === 'decimal' ? 'outline' : 'default'}
              className={`text-base md:text-lg h-12 sm:h-14 ${btn.className || ''} ${btn.type === 'digit' || btn.type === 'decimal' ? 'bg-background hover:bg-muted/50' : ''} ${btn.span ? `col-span-${btn.span}` : ''}`}
              aria-label={btn.label}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

