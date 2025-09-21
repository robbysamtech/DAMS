import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './WorshipMinistry.css';

const WorshipMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Worship"
      apiEndpoint="http://localhost:5001/api/worship-ministry"
      editRoute="/edit-worship-ministry"
      pageTitle="Worship Ministry"
    />
  );
};

export default WorshipMinistry;