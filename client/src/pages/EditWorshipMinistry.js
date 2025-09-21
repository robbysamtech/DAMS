import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditWorshipMinistry.css';

const EditWorshipMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Worship"
      apiEndpoint="http://localhost:5001/api/worship-ministry"
      backRoute="/worship-ministry"
      pageTitle="Worship Ministry"
    />
  );
};

export default EditWorshipMinistry;