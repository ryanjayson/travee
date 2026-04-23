import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { TextInput, Text, Divider } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Formik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import { ItineraryExpense } from "../../../../types/TravelDto";
import { useSaveExpenseMutation } from "../../../../hooks/useExpense";
import { useTravelContext } from "../../../../../../context/TravelContext";
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface EditExpenseProps {
  itineraryExpense: ItineraryExpense | null;
  activityId?: string;
  onClose: () => void;
}

const ExpenseSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  amount: Yup.number().required("Amount is required").positive("Must be positive"),
  dateTime: Yup.date().required("Date is required"),
});

export interface ExpenseFormValues {
  id?: string;
  travelId: string;
  activityId?: string;
  title: string;
  amount: string;
  dateTime: Date;
  currency: string;
  category: string;
  notes: string;
}

const EditExpense = ({
  itineraryExpense,
  activityId,
  onClose,
}: EditExpenseProps) => {
  const { selectedTravelPlan } = useTravelContext();
  const saveMutation = useSaveExpenseMutation();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSaveExpense = async (values: ExpenseFormValues) => {
    const payload: ItineraryExpense = {
      id: values.id,
      travelId: values.travelId,
      activityId: values.activityId,
      title: values.title,
      amount: parseFloat(values.amount),
      dateTime: values.dateTime,
      currency: values.currency,
      category: values.category,
      notes: values.notes,
      isOffline: true,
    };

    await saveMutation.mutateAsync(payload);
    onClose();
  };

  return (
    <Formik<ExpenseFormValues>
      initialValues={{
        id: itineraryExpense?.id,
        travelId: itineraryExpense?.travelId || selectedTravelPlan?.id || "",
        activityId: itineraryExpense?.activityId || activityId,
        title: itineraryExpense?.title || "",
        amount: itineraryExpense?.amount?.toString() || "",
        dateTime: itineraryExpense?.dateTime ? new Date(itineraryExpense.dateTime) : new Date(),
        currency: itineraryExpense?.currency || "USD",
        category: itineraryExpense?.category || "General",
        notes: itineraryExpense?.notes || "",
      }}
      validationSchema={ExpenseSchema}
      onSubmit={handleSaveExpense}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        values,
        errors,
        touched,
      }) => (
        <View className="flex-1 bg-white rounded-t-[20px] overflow-hidden">
          <StatusBar barStyle={"dark-content"} />
          <ScrollView
            className="flex-1 p-[15px] bg-gray-50"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-5">
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Expense Title</Text>
              <TextInput
                mode="outlined"
                placeholder="What was this for?"
                value={values.title}
                onChangeText={handleChange("title")}
                onBlur={handleBlur("title")}
                error={touched.title && Boolean(errors.title)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0C4C8A"
                outlineStyle={{ borderRadius: 16 }}
                style={{ marginTop: 6 }}
              />
              {touched.title && errors.title && (
                <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
              )}
            </View>

            <View className="flex-row gap-4 mb-5">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Amount</Text>
                <TextInput
                  mode="outlined"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={values.amount}
                  onChangeText={handleChange("amount")}
                  onBlur={handleBlur("amount")}
                  error={touched.amount && Boolean(errors.amount)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#0C4C8A"
                  outlineStyle={{ borderRadius: 16 }}
                  style={{ marginTop: 6 }}
                  left={<TextInput.Affix text={values.currency + " "} />}
                />
              </View>
              <View className="w-1/3">
                <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Currency</Text>
                <TextInput
                  mode="outlined"
                  value={values.currency}
                  onChangeText={handleChange("currency")}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#0C4C8A"
                  outlineStyle={{ borderRadius: 16 }}
                  style={{ marginTop: 6 }}
                />
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Date & Time</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="mt-2 border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-4 flex-row items-center justify-between"
              >
                <Text className="text-base text-gray-800">
                  {values.dateTime.toLocaleString()}
                </Text>
                <Icon name="event" size={24} color="#0C4C8A" />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="datetime"
                date={values.dateTime}
                onConfirm={(date) => {
                  setFieldValue("dateTime", date);
                  setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            </View>

            <View className="mb-5">
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Notes</Text>
              <TextInput
                mode="outlined"
                placeholder="Additional details..."
                multiline
                numberOfLines={4}
                value={values.notes}
                onChangeText={handleChange("notes")}
                onBlur={handleBlur("notes")}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0C4C8A"
                outlineStyle={{ borderRadius: 16 }}
                style={{ marginTop: 6, height: 120 }}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View className="px-5 py-4 border-t border-gray-200">
            <TouchButton
              buttonText={itineraryExpense?.id ? "Update Expense" : "Add Expense"}
              onPress={() => handleSubmit()}
              className="h-[64px]"
            />
          </View>
        </View>
      )}
    </Formik>
  );
};

export default EditExpense;


