
// Instructions.tsx
import React from 'react';
import {
  Button,
  ThemeProvider,
  View,
  Heading,
  Message,
  Flex,
  Collection,
  Card,
  Text,
} from '@aws-amplify/ui-react';
import { Messages } from '../constants/messages';

interface AlertComponentProps {
  title: string;
  description: string;
  instructions: Instruction[]; // array of Instruction objects
  type: 'error' | 'info' | 'success' | 'warning';
  onContinue: () => void;
}

interface Instruction {
  title: string;
  description: string;
}


const Instructions: React.FC<AlertComponentProps> = ({
  title,
  description,
  instructions,
  type,
  onContinue
}) => {
  return (
    <div className="container">
    <ThemeProvider>
      <Heading level={3}>{title}</Heading>
      <Flex
        direction="column"
        gap="large"
        width="100%"
        maxWidth="800px"
        margin="auto"
      >
        <Message
          style={{ marginTop: 40 }}
          className="my-message"
          colorTheme={type}
          heading={description}
          variation="filled"
        >
        </Message>

        <Collection
          style={{ marginTop: 40 }}
          type="list"
          items={instructions}
          direction="row"
          justifyContent="space-between"
          wrap="wrap"
        >
          {(item: Instruction) => (
            <Card
              key={item.title}
              variation="outlined"
              style={{ width: '30%' }}
            >
              <Heading level={4}>{item.title}</Heading>
              <Text>{item.description}</Text>
            </Card>
          )}
        </Collection>
        <View style={{ marginTop: 'large' }}>
          <Button variation="primary" onClick={onContinue}>
            {Messages.buttons.continue}
          </Button>
        </View>
      </Flex>
    </ThemeProvider>
    </div>
  );
};

export default Instructions;