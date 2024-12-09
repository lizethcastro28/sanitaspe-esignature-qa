import React from 'react';
import { Button } from '@aws-amplify/ui-react'; 


interface AlertComponentProps {
  title: string;
  description: string;
  instructions: string;
  visible: boolean;
}

const ErrorContent: React.FC<AlertComponentProps> = ({ title, description, instructions, visible }) => {
  return (
    <div className="error-container">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="mb-2">{description}</p>
      <p className="mb-4">{instructions}</p>
      {visible && (
        <Button
          className="custom-button"
          onClick={() => window.location.reload()}
        >
          Regresar
        </Button>
      )}
    </div>
  );
};

export default ErrorContent;
