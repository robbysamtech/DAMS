import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './ChildrenMinistry.css';

const ChildrenMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Children"
      apiEndpoint="http://localhost:5001/api/children-ministry"
      editRoute="/edit-children-ministry"
      pageTitle="Children Ministry"
    />
  );
};

export default ChildrenMinistry;