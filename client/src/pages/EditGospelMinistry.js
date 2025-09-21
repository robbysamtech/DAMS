import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditGospelMinistry.css';

const EditGospelMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Gospel"
      apiEndpoint="http://localhost:5001/api/gospel-ministry"
      backRoute="/gospel-ministry"
      pageTitle="Gospel Ministry"
    />
  );
};

export default EditGospelMinistry;