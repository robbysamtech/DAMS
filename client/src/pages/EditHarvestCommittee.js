import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditHarvestCommittee.css';

const EditHarvestCommittee = () => {
  return (
    <MinistryEditWrapper
      ministryName="Harvest"
      apiEndpoint="http://localhost:5001/api/harvest-committee"
      backRoute="/harvest-committee"
      pageTitle="Harvest Committee"
    />
  );
};

export default EditHarvestCommittee;