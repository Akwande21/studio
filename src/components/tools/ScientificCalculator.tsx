
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Using Input for display

type Operator = '+' | '-' | '×' | '÷' | 'xʸ';

export function ScientificCalculator() {
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const inputDigit = (digit: string) => {
    if (hasError) {
      clearAll();
      setDisplayValue(digit);
      setHasError(false);
      return;
    }
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === "0" ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (hasError) return;
    if (waitingForOperand) {
      setDisplayValue("0.");
      setWaitingForOperand(false);
    } else if (!displayValue.includes(".")) {
      setDisplayValue(displayValue + ".");
    }
  };

  const clearAll = () => {
    setDisplayValue("0");
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
      setDisplayValue(displayValue.slice(0, -1));
    } else if (displayValue !== "0") {
      setDisplayValue("0");
    }
  }

  const toggleSign = () => {
    if (hasError || displayValue === "0") return;
    const numericValue = parseFloat(displayValue);
    if (isNaN(numericValue)) return;
    setDisplayValue((numericValue * -1).toString());
  };

  const inputPercent = () => {
    if (hasError) return;
    const numericValue = parseFloat(displayValue);
    if (isNaN(numericValue)) return;
    setDisplayValue((numericValue / 100).toString());
    setWaitingForOperand(true); // Treat percent as an operation completion for simple cases
  };

  const performOperation = (nextOperator: Operator) => {
    if (hasError) return;
    const inputValue = parseFloat(displayValue);

    if (isNaN(inputValue)) {
      showError();
      return;
    }

    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = calculate(currentValue, inputValue, operator);
      if (result === null) { // Error in calculation
        showError();
        return;
      }
      setCurrentValue(result);
      setDisplayValue(String(result));
    }
    
    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    if (hasError) return;
    const inputValue = parseFloat(displayValue);

    if (isNaN(inputValue)) {
       showError();
       return;
    }

    if (currentValue !== null && operator) {
      const result = calculate(currentValue, inputValue, operator);
      if (result === null) {
        showError();
        return;
      }
      setDisplayValue(String(result));
      setCurrentValue(result); // Keep result for potential chained operations
      setOperator(null); // Clear operator after equals
      setWaitingForOperand(true); // Next number input starts fresh
    }
  };
  
  const showError = () => {
    setDisplayValue("Error");
    setHasError(true);
  }

  const calculate = (val1: number, val2: number, op: Operator): number | null => {
    switch (op) {
      case '+': return val1 + val2;
      case '-': return val1 - val2;
      case '×': return val1 * val2;
      case '÷':
        if (val2 === 0) return null; // Division by zero
        return val1 / val2;
      case 'xʸ': return Math.pow(val1, val2);
      default: return null;
    }
  };

  const handleScientificFunction = (func: string) => {
    if (hasError) return;
    const value = parseFloat(displayValue);
    if (isNaN(value)) {
       showError();
       return;
    }
    let result: number | null = null;

    try {
        switch (func) {
        case 'sin': result = Math.sin(value * Math.PI / 180); break; // Assuming degrees
        case 'cos': result = Math.cos(value * Math.PI / 180); break; // Assuming degrees
        case 'tan': result = Math.tan(value * Math.PI / 180); break; // Assuming degrees
        case 'log': 
            if (value <= 0) { showError(); return; }
            result = Math.log10(value); 
            break;
        case 'sqrt': 
            if (value < 0) { showError(); return; }
            result = Math.sqrt(value); 
            break;
        case 'x²': result = Math.pow(value, 2); break;
        default: break;
        }

        if (result !== null && !isNaN(result) && isFinite(result)) {
            setDisplayValue(result.toString());
        } else {
            showError();
            return;
        }
    } catch {
        showError();
        return;
    }
    setWaitingForOperand(true); // After a scientific function, next input starts a new number
  };

  const buttons = [
    { label: 'sin', type: 'function', action: () => handleScientificFunction('sin'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },
    { label: 'cos', type: 'function', action: () => handleScientificFunction('cos'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },
    { label: 'tan', type: 'function', action: () => handleScientificFunction('tan'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },
    { label: 'log₁₀', type: 'function', action: () => handleScientificFunction('log'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },
    
    { label: '√', type: 'function', action: () => handleScientificFunction('sqrt'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },
    { label: 'x²', type: 'function', action: () => handleScientificFunction('x²'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },
    { label: 'xʸ', type: 'operator', action: () => performOperation('xʸ'), className: "bg-accent/50 hover:bg-accent/70 text-accent-foreground" },
    { label: '←', type: 'action', action: backspace, className: "bg-muted hover:bg-muted/80" },

    { label: 'AC', type: 'clear', action: clearAll, className: "bg-destructive/80 hover:bg-destructive/90 text-destructive-foreground col-span-1" },
    { label: '±', type: 'action', action: toggleSign, className: "bg-muted hover:bg-muted/80" },
    { label: '%', type: 'action', action: inputPercent, className: "bg-muted hover:bg-muted/80" },
    { label: '÷', type: 'operator', action: () => performOperation('÷'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },
    
    { label: '7', type: 'digit', action: () => inputDigit('7') },
    { label: '8', type: 'digit', action: () => inputDigit('8') },
    { label: '9', type: 'digit', action: () => inputDigit('9') },
    { label: '×', type: 'operator', action: () => performOperation('×'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },

    { label: '4', type: 'digit', action: () => inputDigit('4') },
    { label: '5', type: 'digit', action: () => inputDigit('5') },
    { label: '6', type: 'digit', action: () => inputDigit('6') },
    { label: '–', type: 'operator', action: () => performOperation('-'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },

    { label: '1', type: 'digit', action: () => inputDigit('1') },
    { label: '2', type: 'digit', action: () => inputDigit('2') },
    { label: '3', type: 'digit', action: () => inputDigit('3') },
    { label: '+', type: 'operator', action: () => performOperation('+'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },

    { label: '0', type: 'digit', action: () => inputDigit('0'), className: "col-span-2" },
    { label: '.', type: 'decimal', action: inputDecimal },
    { label: '=', type: 'equals', action: handleEquals, className: "bg-green-500 hover:bg-green-600 text-white" },
  ];


  return (
    <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md shadow-2xl border-border">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-center font-mono tracking-wider">Calculator</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Input
            type="text"
            value={displayValue}
            readOnly
            className="h-16 text-4xl text-right bg-muted/30 dark:bg-muted/50 border-2 border-input mb-4 font-mono rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Calculator display"
        />
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn.label}
              onClick={btn.action}
              variant={btn.type === 'digit' || btn.type === 'decimal' ? 'outline' : 'default'}
              className={`text-lg h-14 sm:h-16 ${btn.className || ''} ${btn.type === 'digit' || btn.type === 'decimal' ? 'bg-background hover:bg-muted/50' : ''}`}
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
