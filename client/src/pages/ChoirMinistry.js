import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './ChoirMinistry.css';

const ChoirMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Choir"
      apiEndpoint="http://localhost:5001/api/choir-ministry"
      editRoute="/edit-choir-ministry"
      pageTitle="Choir Ministry"
    />
  );
};

export default ChoirMinistry;