
const React = require('react');

const mockIcon = (name) => {
  const Icon = (props) => {
    return React.createElement('svg', {
      ...props,
      'data-testid': `lucide-${name}`,
      className: props.className || '',
    }, name);
  };
  Icon.displayName = name;
  return Icon;
};

// Add all icons used in the project or a proxy
const icons = {
  DollarSign: mockIcon('DollarSign'),
  Landmark: mockIcon('Landmark'),
  Receipt: mockIcon('Receipt'),
  FileText: mockIcon('FileText'),
  CalendarDays: mockIcon('CalendarDays'),
  Hash: mockIcon('Hash'),
  CreditCard: mockIcon('CreditCard'),
  Wallet: mockIcon('Wallet'),
  Copy: mockIcon('Copy'),
  CheckCircle: mockIcon('CheckCircle'),
  Loader2: mockIcon('Loader2'),
  QrCode: mockIcon('QrCode'),
  GraduationCap: mockIcon('GraduationCap'),
  LogIn: mockIcon('LogIn'),
  Server: mockIcon('Server'),
  UserSearch: mockIcon('UserSearch'),
  FilePlus: mockIcon('FilePlus'),
  CalendarIcon: mockIcon('CalendarIcon'),
  PlusCircle: mockIcon('PlusCircle'),
  Trash2: mockIcon('Trash2'),
  ArrowRight: mockIcon('ArrowRight'),
  ShieldCheck: mockIcon('ShieldCheck'),
  Zap: mockIcon('Zap'),
  LayoutDashboard: mockIcon('LayoutDashboard'),
  LogOut: mockIcon('LogOut'),
  User: mockIcon('User'),
};

module.exports = icons;
