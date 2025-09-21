import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditChildrenMinistry.css';

const EditChildrenMinistry = () => {
  return (
    <MinistryEditWrapper
      ministryName="Children"
      apiEndpoint="http://localhost:5001/api/children-ministry"
      backRoute="/children-ministry"
      pageTitle="Children Ministry"
    />
  );
};

export default EditChildrenMinistry;