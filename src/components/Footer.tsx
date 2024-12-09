import React from 'react';

interface FooterProps {
    content: string;
    bgColor: string;
}

const Footer: React.FC<FooterProps> = ({ content, bgColor}) => {
    return (
        <footer className="footer" style={{ backgroundColor: bgColor }}>
                <div dangerouslySetInnerHTML={{ __html: content }}/>
        </footer>
    );
};

export default Footer;
