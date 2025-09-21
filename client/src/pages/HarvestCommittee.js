import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './HarvestCommittee.css';

const HarvestCommittee = () => {
  return (
    <MinistryPageWrapper
      ministryName="Harvest"
      apiEndpoint="http://localhost:5001/api/harvest-committee"
      editRoute="/edit-harvest-committee"
      pageTitle="Harvest Committee"
    />
  );
};

export default HarvestCommittee;