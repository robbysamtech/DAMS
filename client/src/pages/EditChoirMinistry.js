import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditChoirMinistry.css';

const EditChoirMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Choir"
      apiEndpoint="http://localhost:5001/api/choir-ministry"
      backRoute="/choir-ministry"
      pageTitle="Choir Ministry"
    />
  );
};

export default EditChoirMinistry;