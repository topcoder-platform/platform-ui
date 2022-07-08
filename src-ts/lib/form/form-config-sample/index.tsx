import React from 'react'

import { Form } from '..'

import { FormConfig } from './form_with_sections'

const FormWrapper: React.FC = () => {
  const requestGenerator: () => void = () => {}

  const onSave: (val: any) => Promise<void> = (val: any) => new Promise(() => {}).then(() => {})

  return (
    <div>
      <Form formDef={FormConfig} requestGenerator={requestGenerator} save={onSave} />
    </div>
  )
}

export default FormWrapper
