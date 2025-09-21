import React from 'react';
import { MinistryEditWrapper } from '../components/ministry';
import './EditBibleStudy.css';

const EditBibleStudy = () => {
  return (
    <MinistryEditWrapper
      ministryName="BibleStudy"
      apiEndpoint="http://localhost:5001/api/bible-study"
      backRoute="/bible-study"
      pageTitle="Bible Study"
    />
  );
};

export default EditBibleStudy;