import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './EasterCommittee.css';

const EasterCommittee = () => {
  return (
    <MinistryPageWrapper
      ministryName="Easter"
      apiEndpoint="http://localhost:5001/api/easter-committee"
      editRoute="/edit-easter-committee"
      pageTitle="Easter Committee"
    />
  );
};

export default EasterCommittee;