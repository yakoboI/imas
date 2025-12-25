# DateTimeCard Component

A mathematically precise, Excel-like card component for displaying and selecting date/time information with consistent formatting patterns.

## Features

- **Mathematical Precision**: All date/time calculations use precise formatting with validation
- **Excel-like Layout**: Grid-based structure with consistent spacing and alignment
- **Multiple Date Formats**: Displays full date, short date, and day of week
- **Time Validation**: Validates time input using regex pattern for 24-hour format (HH:MM:SS)
- **Responsive Design**: Adapts to different screen sizes
- **Monospace Fonts**: Uses monospace fonts for numerical data to ensure consistent character width

## Usage

```jsx
import DateTimeCard from '../components/DateTimeCard';

function MyComponent() {
  const handleDateChange = (newDate) => {
    console.log('Date changed:', newDate);
  };

  const handleTimeChange = (newTime) => {
    console.log('Time changed:', newTime);
  };

  return (
    <DateTimeCard
      companyName="Company"
      initialDate={new Date()}
      sessionOpeningTime="00:01:00"
      onDateChange={handleDateChange}
      onTimeChange={handleTimeChange}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `companyName` | `string` | `'Company'` | The company name displayed in the header |
| `initialDate` | `Date` | `new Date()` | The initial date value |
| `sessionOpeningTime` | `string` | `'00:01:00'` | The session opening time in HH:MM:SS format |
| `onDateChange` | `function` | `undefined` | Callback function called when date changes |
| `onTimeChange` | `function` | `undefined` | Callback function called when time changes |

## Date Formats

The component displays dates in multiple formats:

- **Full Date**: `Wednesday, December 24, 2025`
- **Short Date**: `12/24/2025`
- **Day of Week**: `Wednesday`
- **Input Format**: `yyyy-MM-dd` (for date picker)

## Time Format

Time must be in 24-hour format: `HH:MM:SS`

- Hours: `00-23`
- Minutes: `00-59`
- Seconds: `00-59`

Example: `00:01:00`, `09:30:00`, `23:59:59`

## Mathematical Patterns

The component follows mathematical patterns for:

1. **Precise Date Calculations**: Uses `date-fns` library for accurate date formatting
2. **Time Validation**: Regex pattern `^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$` ensures valid time
3. **Consistent Spacing**: Uses Material-UI's spacing system (multiples of 0.5)
4. **Grid Alignment**: Excel-like grid structure with consistent column widths
5. **Character Width**: Monospace fonts ensure consistent numerical display

## Styling

The component uses Material-UI's theming system and is fully responsive. It adapts to:
- Mobile devices (xs breakpoint)
- Tablets (sm breakpoint)
- Desktop (md+ breakpoints)

## Dependencies

- `@mui/material`: Material-UI components
- `date-fns`: Date formatting and manipulation

