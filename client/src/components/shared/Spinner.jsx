const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeMap[size]} border-2 border-gray-200 dark:border-gray-600 border-t-primary-500 rounded-full animate-spin`} />
    </div>
  );
};

export default Spinner;
