# Syntax Highlighting Test

This document tests the newly implemented Prism.js syntax highlighting feature.

## JavaScript Code

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(`Fibonacci of 10 is: ${result}`);
```

## Python Code

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print(f"Sorted: {sorted_numbers}")
```

## CSS Code

```css
.syntax-highlight {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.dark-theme .syntax-highlight {
  background-color: #161b22;
  color: #c9d1d9;
}
```

## HTML Code

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample HTML</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a <strong>sample</strong> HTML document.</p>
</body>
</html>
```

## JSON Code

```json
{
  "name": "markdown-reader",
  "version": "1.0.0",
  "description": "A powerful markdown reader with syntax highlighting",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "dependencies": {
    "marked": "^12.0.0",
    "prismjs": "^1.29.0"
  }
}
```

## Bash Code

```bash
#!/bin/bash

# Install dependencies
npm install

# Start the application
npm start

# Create a backup
tar -czf backup-$(date +%Y%m%d).tar.gz .
```

## No Language Specified

```
This code block has no language specified,
so it should not be syntax highlighted.
It should appear as plain text.
```

Test complete! All code blocks above should now have proper syntax highlighting.
