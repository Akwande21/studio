
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Operator = '+' | '-' | '×' | '÷' | 'xʸ' | 'mod' | 'nCr' | 'nPr';
type UnaryOperationType = 'sqrt' | 'x²' | 'x³' | '1/x' | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'sinh' | 'cosh' | 'tanh' | 'log' | 'ln' | 'e^x' | '10^x' | 'x!' | 'abs' | 'ceil' | 'floor' | 'round';
type MemoryOperationType = 'MC' | 'MR' | 'M+' | 'M-' | 'MS';
type ConstantType = 'π' | 'e';

export function ScientificCalculator() {
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [memoryValue, setMemoryValue] = useState<number>(0);
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [history, setHistory] = useState<string[]>([]);

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
    if (stringValue.length > 15 && Number(value) !== Math.PI && Number(value) !== Math.E) {
      if (Math.abs(Number(value)) > 1e15 || (Math.abs(Number(value)) < 1e-5 && Number(value) !== 0)) {
        setDisplayValue(Number(value).toExponential(9));
      } else {
        setDisplayValue(Number(value).toPrecision(10));
      }
    } else {
      setDisplayValue(stringValue);
    }
  };

  const addToHistory = (calculation: string) => {
    setHistory(prev => [calculation, ...prev.slice(0, 4)]);
  };

  const inputDigit = (digit: string) => {
    if (hasError) {
      clearAll();
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

  const clearEntry = () => {
    if (hasError) {
      clearAll();
      return;
    }
    updateDisplay("0");
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
  };

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
      addToHistory(`${currentValue} ${operator} ${inputValue} = ${result}`);
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
      addToHistory(`${currentValue} ${operator} ${inputValue} = ${result}`);
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
  };

  const toRadians = (degrees: number): number => {
    return angleMode === 'DEG' ? (degrees * Math.PI) / 180 : degrees;
  };

  const toDegrees = (radians: number): number => {
    return angleMode === 'DEG' ? (radians * 180) / Math.PI : radians;
  };

  const factorial = (n: number): number | null => {
    if (n < 0 || !Number.isInteger(n) || n > 170) return null;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const combination = (n: number, r: number): number | null => {
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return null;
    const nFact = factorial(n);
    const rFact = factorial(r);
    const nrFact = factorial(n - r);
    if (nFact === null || rFact === null || nrFact === null) return null;
    return nFact / (rFact * nrFact);
  };

  const permutation = (n: number, r: number): number | null => {
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return null;
    const nFact = factorial(n);
    const nrFact = factorial(n - r);
    if (nFact === null || nrFact === null) return null;
    return nFact / nrFact;
  };

  const calculate = (val1: number, val2: number, op: Operator): number | null => {
    switch (op) {
      case '+': return val1 + val2;
      case '-': return val1 - val2;
      case '×': return val1 * val2;
      case '÷':
        if (val2 === 0) return null;
        return val1 / val2;
      case 'xʸ': return Math.pow(val1, val2);
      case 'mod':
        if (val2 === 0) return null;
        return val1 % val2;
      case 'nCr': return combination(val1, val2);
      case 'nPr': return permutation(val1, val2);
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
      case 'x²': result = Math.pow(inputValue, 2); break;
      case 'x³': result = Math.pow(inputValue, 3); break;
      case '1/x': result = inputValue === 0 ? null : 1 / inputValue; break;
      case 'sin': result = Math.sin(toRadians(inputValue)); break;
      case 'cos': result = Math.cos(toRadians(inputValue)); break;
      case 'tan': result = Math.tan(toRadians(inputValue)); break;
      case 'asin': 
        result = Math.abs(inputValue) > 1 ? null : toDegrees(Math.asin(inputValue));
        break;
      case 'acos':
        result = Math.abs(inputValue) > 1 ? null : toDegrees(Math.acos(inputValue));
        break;
      case 'atan': result = toDegrees(Math.atan(inputValue)); break;
      case 'sinh': result = Math.sinh(inputValue); break;
      case 'cosh': result = Math.cosh(inputValue); break;
      case 'tanh': result = Math.tanh(inputValue); break;
      case 'log': result = inputValue <= 0 ? null : Math.log10(inputValue); break;
      case 'ln': result = inputValue <= 0 ? null : Math.log(inputValue); break;
      case 'e^x': result = Math.exp(inputValue); break;
      case '10^x': result = Math.pow(10, inputValue); break;
      case 'x!': result = factorial(inputValue); break;
      case 'abs': result = Math.abs(inputValue); break;
      case 'ceil': result = Math.ceil(inputValue); break;
      case 'floor': result = Math.floor(inputValue); break;
      case 'round': result = Math.round(inputValue); break;
      default: break;
    }

    if (result === null || !isFinite(result)) {
      showError();
    } else {
      addToHistory(`${operation}(${inputValue}) = ${result}`);
      updateDisplay(result);
      setWaitingForOperand(true);
    }
  };

  const handleMemoryOperation = (operation: MemoryOperationType) => {
    if (hasError && operation !== 'MC') return;
    const currentDisplayNumber = parseFloat(displayValue);

    switch (operation) {
      case 'MC':
        setMemoryValue(0);
        if (hasError) clearAll();
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
      case 'M-':
        if (!hasError && !isNaN(currentDisplayNumber)) {
          setMemoryValue(memoryValue - currentDisplayNumber);
        }
        break;
      case 'MS':
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
      case 'e':
        updateDisplay(Math.E);
        break;
    }
    setWaitingForOperand(true);
  };

  const toggleAngleMode = () => {
    setAngleMode(prev => prev === 'DEG' ? 'RAD' : 'DEG');
  };

  const buttons: Array<{ label: string, action: () => void, className?: string, span?: number }> = [
    // Row 1: Memory and Mode
    { label: 'MC', action: () => handleMemoryOperation('MC'), className: "bg-muted hover:bg-muted/80 text-xs" },
    { label: 'MR', action: () => handleMemoryOperation('MR'), className: "bg-muted hover:bg-muted/80 text-xs" },
    { label: 'M+', action: () => handleMemoryOperation('M+'), className: "bg-muted hover:bg-muted/80 text-xs" },
    { label: 'M-', action: () => handleMemoryOperation('M-'), className: "bg-muted hover:bg-muted/80 text-xs" },
    { label: 'MS', action: () => handleMemoryOperation('MS'), className: "bg-muted hover:bg-muted/80 text-xs" },
    { label: angleMode, action: toggleAngleMode, className: "bg-accent/20 hover:bg-accent/40 text-xs font-bold" },

    // Row 2: Advanced Functions
    { label: 'sin', action: () => handleUnaryOperation('sin'), className: "bg-blue-100 hover:bg-blue-200 text-xs" },
    { label: 'cos', action: () => handleUnaryOperation('cos'), className: "bg-blue-100 hover:bg-blue-200 text-xs" },
    { label: 'tan', action: () => handleUnaryOperation('tan'), className: "bg-blue-100 hover:bg-blue-200 text-xs" },
    { label: 'sinh', action: () => handleUnaryOperation('sinh'), className: "bg-blue-100 hover:bg-blue-200 text-xs" },
    { label: 'cosh', action: () => handleUnaryOperation('cosh'), className: "bg-blue-100 hover:bg-blue-200 text-xs" },
    { label: 'tanh', action: () => handleUnaryOperation('tanh'), className: "bg-blue-100 hover:bg-blue-200 text-xs" },

    // Row 3: Inverse Trig
    { label: 'asin', action: () => handleUnaryOperation('asin'), className: "bg-purple-100 hover:bg-purple-200 text-xs" },
    { label: 'acos', action: () => handleUnaryOperation('acos'), className: "bg-purple-100 hover:bg-purple-200 text-xs" },
    { label: 'atan', action: () => handleUnaryOperation('atan'), className: "bg-purple-100 hover:bg-purple-200 text-xs" },
    { label: 'x!', action: () => handleUnaryOperation('x!'), className: "bg-green-100 hover:bg-green-200 text-xs" },
    { label: 'nCr', action: () => performOperation('nCr'), className: "bg-green-100 hover:bg-green-200 text-xs" },
    { label: 'nPr', action: () => performOperation('nPr'), className: "bg-green-100 hover:bg-green-200 text-xs" },

    // Row 4: Powers and Roots
    { label: 'x²', action: () => handleUnaryOperation('x²'), className: "bg-orange-100 hover:bg-orange-200 text-xs" },
    { label: 'x³', action: () => handleUnaryOperation('x³'), className: "bg-orange-100 hover:bg-orange-200 text-xs" },
    { label: 'xʸ', action: () => performOperation('xʸ'), className: "bg-orange-100 hover:bg-orange-200 text-xs" },
    { label: '√', action: () => handleUnaryOperation('sqrt'), className: "bg-orange-100 hover:bg-orange-200 text-xs" },
    { label: '1/x', action: () => handleUnaryOperation('1/x'), className: "bg-orange-100 hover:bg-orange-200 text-xs" },
    { label: 'mod', action: () => performOperation('mod'), className: "bg-orange-100 hover:bg-orange-200 text-xs" },

    // Row 5: Logarithms and Exponentials
    { label: 'log₁₀', action: () => handleUnaryOperation('log'), className: "bg-yellow-100 hover:bg-yellow-200 text-xs" },
    { label: 'ln', action: () => handleUnaryOperation('ln'), className: "bg-yellow-100 hover:bg-yellow-200 text-xs" },
    { label: 'e^x', action: () => handleUnaryOperation('e^x'), className: "bg-yellow-100 hover:bg-yellow-200 text-xs" },
    { label: '10^x', action: () => handleUnaryOperation('10^x'), className: "bg-yellow-100 hover:bg-yellow-200 text-xs" },
    { label: 'π', action: () => insertConstant('π'), className: "bg-accent/20 hover:bg-accent/40 text-xs" },
    { label: 'e', action: () => insertConstant('e'), className: "bg-accent/20 hover:bg-accent/40 text-xs" },

    // Row 6: Rounding Functions
    { label: 'abs', action: () => handleUnaryOperation('abs'), className: "bg-gray-100 hover:bg-gray-200 text-xs" },
    { label: '⌈x⌉', action: () => handleUnaryOperation('ceil'), className: "bg-gray-100 hover:bg-gray-200 text-xs" },
    { label: '⌊x⌋', action: () => handleUnaryOperation('floor'), className: "bg-gray-100 hover:bg-gray-200 text-xs" },
    { label: 'round', action: () => handleUnaryOperation('round'), className: "bg-gray-100 hover:bg-gray-200 text-xs" },
    { label: 'CE', action: clearEntry, className: "bg-red-100 hover:bg-red-200 text-xs" },
    { label: 'AC', action: clearAll, className: "bg-destructive/80 hover:bg-destructive/90 text-destructive-foreground text-xs" },

    // Row 7: Basic Operations
    { label: '±', action: toggleSign, className: "bg-muted hover:bg-muted/80" },
    { label: '%', action: inputPercent, className: "bg-muted hover:bg-muted/80" },
    { label: '←', action: backspace, className: "bg-muted hover:bg-muted/80" },
    { label: '÷', action: () => performOperation('÷'), className: "bg-primary/80 hover:bg-primary/90 text-primary-foreground" },

    // Numbers and remaining operations
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card className="shadow-2xl border-border">
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-mono tracking-wider">Advanced Scientific Calculator</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {angleMode}
              </Badge>
              {memoryValue !== 0 && (
                <Badge variant="secondary" className="text-xs">
                  M: {memoryValue.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Input
            type="text"
            value={displayValue}
            readOnly
            className="h-16 text-2xl sm:text-3xl text-right bg-muted/30 dark:bg-muted/50 border-2 border-input mb-4 font-mono rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Calculator display"
          />
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {buttons.map((btn, index) => (
              <Button
                key={`${btn.label}-${index}`}
                onClick={btn.action}
                variant="outline"
                className={`text-xs sm:text-sm h-10 sm:h-12 ${btn.className || 'bg-background hover:bg-muted/50'} ${btn.span ? `col-span-${btn.span}` : ''}`}
                aria-label={btn.label}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Calculation History</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {history.map((calc, index) => (
                <div key={index} className="text-xs font-mono text-muted-foreground p-1 bg-muted/20 rounded">
                  {calc}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
