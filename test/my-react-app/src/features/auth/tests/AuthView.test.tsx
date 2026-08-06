import React from 'react';
import { AuthView } from '../components/AuthView';

export function testAuthView() {
  if (typeof AuthView !== 'function') {
    throw new Error('AuthView is not defined');
  }
}
