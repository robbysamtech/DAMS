import React from 'react';
import { MinistryPageWrapper } from '../components/ministry';
import './BibleStudy.css';

const BibleStudy = () => {
  return (
    <MinistryPageWrapper
      ministryName="BibleStudy"
      apiEndpoint="http://localhost:5001/api/bible-study"
      editRoute="/edit-bible-study"
      pageTitle="Bible Study"
    />
  );
};

export default BibleStudy;