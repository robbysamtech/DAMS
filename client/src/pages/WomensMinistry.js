import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './WomensMinistry.css';

const WomensMinistry = () => {
  return (
    <MinistryPageWrapper
      ministryName="Womens"
      apiEndpoint="http://localhost:5001/api/womens-ministry"
      editRoute="/edit-womens-ministry"
      pageTitle="Womens Ministry"
    />
  );
};

export default WomensMinistry;