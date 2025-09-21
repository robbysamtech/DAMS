import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './EasterMinistry.css';

const EasterMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Easter"
      apiEndpoint="http://localhost:5001/api/easter-ministry"
      editRoute="/edit-easter-ministry"
      pageTitle="Easter Ministry"
    />
  );
};

export default EasterMinistry;
