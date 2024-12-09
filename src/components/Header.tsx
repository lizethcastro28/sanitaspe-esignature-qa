import React from 'react';

interface HeaderProps {
    content: string;
    url: string;
    bgColor: string;
    location: 'left' | 'center' | 'right';
}

const Header: React.FC<HeaderProps> = ({ url, content, bgColor, location }) => {
    return (
        <header className="header" style={{ backgroundColor: bgColor }}>
            <div className="header-content" style={{ justifyContent: location }}>
                <img src={url} alt="Logo" className="header-logo" />
                <span className="header-text" style={{ marginLeft: '10px' }}>{content}</span>
            </div>
        </header>
    );
};

export default Header;
