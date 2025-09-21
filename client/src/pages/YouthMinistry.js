import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './YouthMinistry.css';

const YouthMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Youth"
      apiEndpoint="http://localhost:5001/api/youth-ministry"
      editRoute="/edit-youth-ministry"
      pageTitle="Youth Ministry"
    />
  );
};

export default YouthMinistry;
