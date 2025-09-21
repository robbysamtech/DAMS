import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditMensMinistry.css';

const EditMensMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Mens"
      apiEndpoint="http://localhost:5001/api/mens-ministry"
      backRoute="/mens-ministry"
      pageTitle="Mens Ministry"
    />
  );
};

export default EditMensMinistry;