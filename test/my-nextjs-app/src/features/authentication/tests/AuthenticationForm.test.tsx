import React from 'react';
import { AuthenticationForm } from '../components/AuthenticationForm';

export function testAuthenticationForm() {
  if (typeof AuthenticationForm !== 'function') {
    throw new Error('AuthenticationForm is not defined');
  }
}
