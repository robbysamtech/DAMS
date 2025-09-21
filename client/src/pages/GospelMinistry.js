import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './GospelMinistry.css';

const GospelMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Gospel"
      apiEndpoint="http://localhost:5001/api/gospel-ministry"
      editRoute="/edit-gospel-ministry"
      pageTitle="Gospel Ministry"
    />
  );
};

export default GospelMinistry;