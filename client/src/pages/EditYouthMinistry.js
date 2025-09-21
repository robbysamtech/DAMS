import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditYouthMinistry.css';

const EditYouthMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Youth"
      apiEndpoint="http://localhost:5001/api/youth-ministry"
      backRoute="/youth-ministry"
      pageTitle="Youth Ministry"
    />
  );
};

export default EditYouthMinistry;
