// Common table styling for consistent straight borders
export const tableStyles = {
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  borderSpacing: 0,
  '& .MuiTableCell-root': {
    borderRight: '1px solid',
    borderRightColor: 'divider',
    padding: '12px 16px',
    verticalAlign: 'middle',
    '&:last-child': {
      borderRight: 'none'
    }
  },
  '& .MuiTableHead .MuiTableCell-root': {
    borderBottom: '2px solid',
    borderBottomColor: 'divider',
    fontWeight: 600,
    backgroundColor: 'action.hover'
  },
  '& .MuiTableBody .MuiTableRow': {
    '&:hover': {
      backgroundColor: 'action.hover'
    },
    '& .MuiTableCell-root': {
      borderBottom: '1px solid',
      borderBottomColor: 'divider'
    },
    '&:last-child .MuiTableCell-root': {
      borderBottom: 'none'
    }
  }
};

// Small table styles (for nested tables)
export const smallTableStyles = {
  ...tableStyles,
  '& .MuiTableCell-root': {
    ...tableStyles['& .MuiTableCell-root'],
    padding: '8px 12px'
  }
};

