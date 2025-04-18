import { useState, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export const useForm = ({
  initialValues,
  validationSchema,
  onSubmit,
  enableReinitialize = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        await onSubmit(values);
        resetForm();
      } catch (error) {
        setSubmitError(error.message || 'An error occurred while submitting the form');
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    },
    [onSubmit]
  );

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape(validationSchema),
    onSubmit: handleSubmit,
    enableReinitialize,
  });

  const resetForm = useCallback(() => {
    formik.resetForm();
    setSubmitError(null);
  }, [formik]);

  const setFieldValue = useCallback(
    (field, value) => {
      formik.setFieldValue(field, value);
    },
    [formik]
  );

  const setFieldError = useCallback(
    (field, error) => {
      formik.setFieldError(field, error);
    },
    [formik]
  );

  const setFieldTouched = useCallback(
    (field, touched = true) => {
      formik.setFieldTouched(field, touched);
    },
    [formik]
  );

  return {
    ...formik,
    isSubmitting,
    submitError,
    resetForm,
    setFieldValue,
    setFieldError,
    setFieldTouched,
  };
};

export default useForm; 