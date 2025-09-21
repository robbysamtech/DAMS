import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './MensMinistry.css';

const MensMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Mens"
      apiEndpoint="http://localhost:5001/api/mens-ministry"
      editRoute="/edit-mens-ministry"
      pageTitle="Mens Ministry"
    />
  );
};

export default MensMinistry;