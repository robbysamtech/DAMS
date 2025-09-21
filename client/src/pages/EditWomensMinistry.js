import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditWomensMinistry.css';

const EditWomensMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Womens"
      apiEndpoint="http://localhost:5001/api/womens-ministry"
      backRoute="/womens-ministry"
      pageTitle="Womens Ministry"
    />
  );
};

export default EditWomensMinistry;