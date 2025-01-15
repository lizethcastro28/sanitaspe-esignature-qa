import React from 'react';
import {
  Button,
  ThemeProvider,
  View,
  Heading,
  Message,
  Flex,
} from '@aws-amplify/ui-react';
import { Messages } from '../constants/messages';

interface AlertComponentProps {
  title: string;
  description: string;
  instructions: string;
  visible: boolean;
  type: 'error' | 'info' | 'success' | 'warning'; // Define el tipo de MessageColorTheme
}

const ErrorContent: React.FC<AlertComponentProps> = ({
  title,
  description,
  instructions,
  visible,
  type,
}) => {

  return (
    <>
      <ThemeProvider >
        <Heading level={1}>
          {title}
        </Heading>
        <Flex style={{ marginTop: 20 }} direction="column" gap="large" width="100%" maxWidth="800px" margin="auto">
          <Message className="my-message"
            colorTheme={type}
            heading={description}
            variation="filled"
          >
            {instructions}
          </Message>
          <View style={{ marginTop: 'large' }}>
            {visible && (
              <Button variation="primary" onClick={() => window.location.reload()}>
                {Messages.buttons.back}
              </Button>
            )}
          </View>
        </Flex>
      </ThemeProvider>
    </>
  );
};

export default ErrorContent;