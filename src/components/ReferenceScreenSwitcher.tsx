import React from 'react';
import { Layers } from 'lucide-react';

interface ReferenceScreenSwitcherProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const ReferenceScreenSwitcher: React.FC<ReferenceScreenSwitcherProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const screens = [
    { id: 'landing', label: '1. Landing' },
    { id: 'auth', label: '2. Register/Login' },
    { id: 'donor', label: '3. Donor Dash' },
    { id: 'add-food', label: '4. Add Food' },
    { id: 'browse', label: '5. Browse Food' },
    { id: 'details', label: '6. Details' },
    { id: 'recipient', label: '7. Recipient Dash' },
    { id: 'coordinator', label: '8. Coordinator' },
    { id: 'notifications', label: '9. Notifications' },
    { id: 'profile', label: '10. Profile' },
  ];

  return (
    <aside className="sl-ref-switcher" aria-label="Reference Screen Switcher">
      <div className="sl-ref-switcher__inner">
        <div className="sl-ref-switcher__tag">
          <Layers size={14} />
          <span>Reference View:</span>
        </div>
        <div className="sl-ref-switcher__scroll">
          {screens.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sl-ref-switcher__btn ${currentScreen === item.id ? 'sl-ref-switcher__btn--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
