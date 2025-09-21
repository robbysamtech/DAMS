import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditEasterMinistry.css';

const EditEasterMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Easter"
      apiEndpoint="http://localhost:5001/api/easter-ministry"
      backRoute="/easter-ministry"
      pageTitle="Easter Ministry"
    />
  );
};

export default EditEasterMinistry;