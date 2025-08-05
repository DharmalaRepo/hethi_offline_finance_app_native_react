export const formatCurrency = (amount: number, currency: string = '₹') => {
  return `${currency}${amount.toFixed(2)}`;
};

export const getMonthName = (monthNumber: number): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNumber - 1] || '';
};