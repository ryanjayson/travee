import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from "react-native";
import { TextInput, Text, Divider } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Formik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../../components/atoms/TouchButton";
import { ItineraryExpense, ItineraryActivity } from "../../../types/TravelDto";
import { useSaveExpenseMutation } from "../../../hooks/useExpense";
import { useTravelContext } from "../../../../../context/TravelContext";
import { useAuth } from "../../../../Auth/hooks/AuthContext";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ExpenseCategory } from "../../../../../types/enums";
import ExpenseCategoryIcon from "./ExpenseCategoryIcon";
import ActivityIcon from "../../../../../components/ActivityIcon";

interface EditExpenseProps {
  itineraryExpense: ItineraryExpense | null;
  activityId?: string;
  activities?: ItineraryActivity[];
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
  expenseCategory: ExpenseCategory;
  userId: string;
  notes: string;
}

const EditExpense = ({
  itineraryExpense,
  activityId,
  activities,
  onClose,
}: EditExpenseProps) => {
  const { selectedTravelPlan } = useTravelContext();
  const { userToken } = useAuth();
  const saveMutation = useSaveExpenseMutation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

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
      expenseCategory: values.expenseCategory,
      userId: values.userId,
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
        expenseCategory: itineraryExpense?.expenseCategory ?? ExpenseCategory.None,
        userId: itineraryExpense?.userId || userToken || "current-user",
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
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Linked Activity (Optional)</Text>
              <TouchableOpacity
                onPress={() => setShowActivityModal(true)}
                className="mt-2 border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-4 flex-row items-center gap-3"
              >
                {values.activityId ? (
                  <>
                    <ActivityIcon type={activities?.find(a => a.id === values.activityId)?.type as any} size={28} />
                    <Text className="text-base text-gray-800 flex-1" numberOfLines={1}>
                      {activities?.find(a => a.id === values.activityId)?.title}
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon name="event-note" size={28} color="#BDBDBD" />
                    <Text className="text-base text-gray-400 flex-1">
                      No Activity Selected
                    </Text>
                  </>
                )}
                {values.activityId && (
                   <TouchableOpacity onPress={() => setFieldValue("activityId", undefined)}>
                     <Icon name="close" size={20} color="#666" />
                   </TouchableOpacity>
                )}
                <Icon name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
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
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Expense Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(true)}
                className="mt-2 border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-4 flex-row items-center gap-3"
              >
                <ExpenseCategoryIcon category={values.expenseCategory} size={28} color="#0C4C8A" />
                <Text className="text-base text-gray-800 flex-1">
                  {values.expenseCategory === ExpenseCategory.None
                    ? "Select Category"
                    : ExpenseCategory[values.expenseCategory].replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Icon name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
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

          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50 p-5">
              <View className="bg-white rounded-[30px] shadow-lg w-full max-h-[80%] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                  <Text className="text-lg font-bold text-[#0C4C8A]">
                    Select Category
                  </Text>
                  <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {Object.keys(ExpenseCategory)
                    .filter((key) => isNaN(Number(key)) && key !== "None")
                    .map((key) => {
                      const categoryValue = ExpenseCategory[key as keyof typeof ExpenseCategory];
                      return (
                        <TouchableOpacity
                          key={key}
                          className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                          onPress={() => {
                            setFieldValue("expenseCategory", categoryValue);
                            setShowCategoryModal(false);
                          }}
                        >
                          <ExpenseCategoryIcon category={categoryValue} size={24} color="#183B7A" />
                          <Text className="text-base text-gray-800">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Text>
                          {values.expenseCategory === categoryValue && (
                            <Icon name="check" size={24} color="#0C4C8A" style={{ marginLeft: "auto" }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showActivityModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowActivityModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50 p-5">
              <View className="bg-white rounded-[30px] shadow-lg w-full max-h-[80%] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                  <Text className="text-lg font-bold text-[#0C4C8A]">
                    Select Activity
                  </Text>
                  <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                   <TouchableOpacity
                    className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                    onPress={() => {
                      setFieldValue("activityId", undefined);
                      setShowActivityModal(false);
                    }}
                  >
                    <Icon name="event-busy" size={24} color="#666" />
                    <Text className="text-base text-gray-800">
                      None
                    </Text>
                    {!values.activityId && (
                      <Icon name="check" size={24} color="#0C4C8A" style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                  {activities?.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                      onPress={() => {
                        setFieldValue("activityId", activity.id);
                        setShowActivityModal(false);
                      }}
                    >
                      <ActivityIcon type={activity.type as any} size={24} />
                      <View className="flex-1">
                        <Text className="text-base text-gray-800 font-medium">
                          {activity.title}
                        </Text>
                        {activity.startDate && (
                           <Text className="text-xs text-gray-500">
                             {new Date(activity.startDate).toLocaleDateString()}
                           </Text>
                        )}
                      </View>
                      {values.activityId === activity.id && (
                        <Icon name="check" size={24} color="#0C4C8A" style={{ marginLeft: "auto" }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </Formik>
  );
};

export default EditExpense;


