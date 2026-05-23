const EmptyState = ({ icon: Icon, title, subtitle, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4 max-w-xs">{subtitle}</p>
      )}
      {action && action}
    </div>
  );
};

export default EmptyState;
