import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditEasterCommittee.css';

const EditEasterCommittee = () => {
  return (
    <MinistryEditWrapper
      ministryName="Easter"
      apiEndpoint="http://localhost:5001/api/easter-committee"
      backRoute="/easter-committee"
      pageTitle="Easter Committee"
    />
  );
};

export default EditEasterCommittee;