import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';

const LockScreen = ({ navigation }) => {
  const [pin, setPin] = useState('');
  const correctPin = '1234'; // Hardcoded for now

  const verifyPin = () => {
    if (pin === correctPin) {
      navigation.goBack();
    } else {
      alert('Incorrect PIN');
    }
  };

  return (
    <View>
      <Text>Enter PIN to Unlock</Text>
      <TextInput
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
      />
      <Button title="Unlock" onPress={verifyPin} />
    </View>
  );
};

export default LockScreen;
