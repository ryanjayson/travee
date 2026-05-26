import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Checkbox, Divider, TextInput } from "react-native-paper";
import * as Yup from "yup";
import ActivityIcon from "../../../../../components/ActivityIcon";
import TouchButton from "../../../../../components/atoms/TouchButton";
import { useTravelContext } from "../../../../../context/TravelContext";
import { ExpenseCategory } from "../../../../../types/enums";
import { useAuth } from "../../../../Auth/hooks/AuthContext";
import { useSaveExpenseMutation } from "../../../hooks/useExpense";
import { useTripMembers } from "../../../hooks/useTripMembers";
import { ItineraryActivity, ItineraryExpense } from "../../../types/TravelDto";
import ExpenseCategoryIcon from "./ExpenseCategoryIcon";

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
  memberId: string;
  title: string;
  amount: string;
  dateTime: Date;
  currency: string;
  category: string;
  expenseCategory: ExpenseCategory;
  userId: string;
  notes: string;
  isIncludeInBill: boolean;
}

const EditExpense = ({
  itineraryExpense,
  activityId,
  activities,
  onClose,
}: EditExpenseProps) => {
  const { selectedTravelPlan } = useTravelContext();
  const { userToken } = useAuth();
  const { mutate: updateExpense, isPending: isSaving } = useSaveExpenseMutation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const { data: members = [] } = useTripMembers(selectedTravelPlan?.id || "");

  const formik = useFormik({
    initialValues: {
      id: itineraryExpense?.id,
        travelId: itineraryExpense?.travelId || selectedTravelPlan?.id || "",
        activityId: itineraryExpense?.activityId || activityId,
        memberId: itineraryExpense?.memberId || "",
        title: itineraryExpense?.title || "",
        amount: itineraryExpense?.amount?.toString() || "",
        dateTime: itineraryExpense?.dateTime ? new Date(itineraryExpense.dateTime) : new Date(),
        currency: itineraryExpense?.currency || "USD",
        category: itineraryExpense?.category || "General",
        expenseCategory: itineraryExpense?.expenseCategory ?? ExpenseCategory.None,
        userId: itineraryExpense?.userId || userToken || "current-user",
        notes: itineraryExpense?.notes || "",
        isIncludeInBill: itineraryExpense?.isIncludeInBill ?? true,
    },
    validationSchema: ExpenseSchema,
    onSubmit: (values) => {
      const payload: ItineraryExpense = {
      id: values.id,
      travelId: values.travelId,
      activityId: values.activityId,
      memberId: values.isIncludeInBill ? undefined : (values.memberId || undefined),
      title: values.title,
      amount: parseFloat(values.amount),
      dateTime: values.dateTime,
      currency: values.currency,
      category: values.category,
      expenseCategory: values.expenseCategory,
      userId: values.userId,
      notes: values.notes,
      isOffline: true,
      isIncludeInBill: values.isIncludeInBill,
    };
    updateExpense({...payload as any }, {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
          onError: (err: any) => {
            console.error("Failed to save travel:", err);
            // setError("Failed to save travel. Please try again.");
          },
        });

    },
  });

  return (
      <View className="flex-1 bg-gray-100 overflow-hidden">
          <ScrollView
            className="flex-1 p-[15px] bg-gray-100"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="never"
          >
            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Expense Title</Text>
              <TextInput
                mode="outlined"
                placeholder="What was this for?"
                value={formik.values.title}
                onChangeText={formik.handleChange("title")}
                onBlur={formik.handleBlur("title")}
                error={formik.touched.title && Boolean(formik.errors.title)}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6, height: 64 }}
                contentStyle={{ backgroundColor: "transparent" }}

              />
              {formik.touched.title && formik.errors.title && (
                <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.title}</Text>
              )}
            </View>
            <View className="flex-row gap-4 mb-5">
              <View className="flex-1">
                <Text className="text-xs font-semibold tracking-wider uppercase">Amount</Text>
                <TextInput
                  mode="outlined"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formik.values.amount}
                  onChangeText={formik.handleChange("amount")}
                  onBlur={formik.handleBlur("amount")}
                  error={formik.touched.amount && Boolean(formik.errors.amount)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#263F69"
                  theme={{ colors: { onSurfaceVariant: '#888' } }}
                  outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                  style={{ marginTop: 6, height: 64 }}
                  contentStyle={{ backgroundColor: "transparent" }}
                  left={<TextInput.Affix text={formik.values.currency + " "} />}
                />
                {formik.touched.amount && formik.errors.amount && (
                  <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.amount}</Text>
                )}
              </View>
              <View className="w-1/3">
                <Text className="text-xs font-semibold tracking-wider uppercase">Currency</Text>
                <TextInput
                  mode="outlined"
                  value={formik.values.currency}
                  onChangeText={formik.handleChange("currency")}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#263F69"
                  theme={{ colors: { onSurfaceVariant: '#888' } }}
                  outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                  style={{ marginTop: 6, height: 64 }}
                  contentStyle={{ backgroundColor: "transparent" }}
                />
              </View>
            </View>

            <View className="flex-row items-center mb-5">
              <Checkbox
                status={formik.values.isIncludeInBill ? 'checked' : 'unchecked'}
                onPress={() => {
                  const nextVal = !formik.values.isIncludeInBill;
                  formik.setFieldValue('isIncludeInBill', nextVal);
                  if (nextVal) {
                    formik.setFieldValue('memberId', '');
                  }
                }}
                color="#263F69"
              />
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  const nextVal = !formik.values.isIncludeInBill;
                  formik.setFieldValue('isIncludeInBill', nextVal);
                  if (nextVal) {
                    formik.setFieldValue('memberId', '');
                  }
                }}
                accessibilityRole="checkbox"
              >
                <Text className="text-base text-gray-700 font-medium ml-1">
                  Include in bill split
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Assign to Member</Text>
              <TouchableOpacity
                disabled={formik.values.isIncludeInBill}
                onPress={() => setShowMemberModal(true)}
                className={`mt-2 border h-7xl rounded-[16px] px-4 py-4 flex-row items-center gap-3 ${
                  formik.values.isIncludeInBill 
                    ? "bg-gray-100 border-gray-200 opacity-60" 
                    : "bg-white border-[#E0E0E0]"
                }`}
                accessibilityRole="button"
                accessibilityLabel="Assign expense to member"
              >
                <Icon 
                  name="person" 
                  size={28} 
                  color={formik.values.isIncludeInBill ? "#BDBDBD" : "#263F69"} 
                />
                <Text 
                  className={`text-base flex-1 ${
                    formik.values.isIncludeInBill 
                      ? "text-gray-400" 
                      : formik.values.memberId 
                        ? "text-gray-800" 
                        : "text-gray-500"
                  }`} 
                  numberOfLines={1}
                >
                  {formik.values.isIncludeInBill
                    ? "Enabled only if 'Include in bill split' is unchecked"
                    : formik.values.memberId
                      ? members.find(m => String(m.id) === String(formik.values.memberId))?.name || "Select Member"
                      : "Select Member"}
                </Text>
                {!formik.values.isIncludeInBill && formik.values.memberId ? (
                  <TouchableOpacity 
                    onPress={() => formik.setFieldValue("memberId", "")}
                    accessibilityRole="button"
                    accessibilityLabel="Clear member selection"
                  >
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                ) : null}
                <Icon 
                  name="keyboard-arrow-down" 
                  size={24} 
                  color={formik.values.isIncludeInBill ? "#BDBDBD" : "#666"} 
                />
              </TouchableOpacity>
            </View>
            
            <View className="h-1px bg-gray-300 my-4 mx-2" />

            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Date & Time</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="mt-2 border border-[#E0E0E0] h-7xl rounded-[16px] bg-white px-4 py-4 flex-row items-center justify-between"
              >
                <Text className="text-base text-gray-800">
                  {formik.values.dateTime.toLocaleString()}
                </Text>
                <Icon name="event" size={24} color="#263F69" />
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="datetime"
                date={formik.values.dateTime}
                onConfirm={(date) => {
                  formik.setFieldValue("dateTime", date);
                  setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            </View>
            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Linked Activity (Optional)</Text>
              <TouchableOpacity
                onPress={() => setShowActivityModal(true)}
                className="mt-2 border h-7xl border-[#E0E0E0] rounded-[16px] bg-white px-4 py-4 flex-row items-center gap-3"
              >
                {formik.values.activityId ? (
                  <>
                    <ActivityIcon type={activities?.find(a => a.id === formik.values.activityId)?.type as any} size={28} />
                    <Text className="text-base text-gray-800 flex-1" numberOfLines={1}>
                      {activities?.find(a => a.id === formik.values.activityId)?.title}
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon name="event-note" size={28} color="#BDBDBD" />
                    <Text className="text-base text-gray-500 flex-1">
                      No Activity Selected
                    </Text>
                  </>
                )}
                {formik.values.activityId && (
                   <TouchableOpacity onPress={() => formik.setFieldValue("activityId", undefined)}>
                     <Icon name="close" size={20} color="#666" />
                   </TouchableOpacity>
                )}
                <Icon name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>
    
            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Expense Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(true)}
                className="mt-2 border border-[#E0E0E0] h-[64px] rounded-[16px] bg-white px-4 py-4 flex-row items-center gap-3"
              >
                <ExpenseCategoryIcon category={formik.values.expenseCategory} size={28} color="#263F69" />
                <Text className="text-base text-gray-800 flex-1">
                  {formik.values.expenseCategory === ExpenseCategory.None
                    ? "Select Category"
                    : ExpenseCategory[formik.values.expenseCategory].replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Icon name="keyboard-arrow-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Notes</Text>
              <TextInput
                mode="outlined"
                placeholder="Additional details..."
                multiline
                numberOfLines={4}
                value={formik.values.notes}
                onChangeText={formik.handleChange("notes")}
                onBlur={formik.handleBlur("notes")}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6, height: 120 }}
                textAlignVertical="top"
                contentStyle={{ backgroundColor: "transparent" }}
              />
            </View>
      
            <View className="mb-8 mx-4 bg-transparent">
              <TouchButton
                buttonText={itineraryExpense?.id ? "Update Expense" : "Add Expense"}
                onPress={() => formik.handleSubmit()}
                disabled={!formik.values.title?.trim() || isSaving}
                className="h-7xl p-6"
              />
            </View>

          </ScrollView>

          <Modal
            visible={showCategoryModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50 p-5">
              <View className="bg-white rounded-[30px] shadow-lg w-full max-h-[80%] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                  <Text className="text-lg font-bold text-[#263F69]">
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
                            formik.setFieldValue("expenseCategory", categoryValue);
                            setShowCategoryModal(false);
                          }}
                        >
                          <ExpenseCategoryIcon category={categoryValue} size={24} color="#183B7A" />
                          <Text className="text-base text-gray-800">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Text>
                          {formik.values.expenseCategory === categoryValue && (
                            <Icon name="check" size={24} color="#263F69" style={{ marginLeft: "auto" }} />
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
                  <Text className="text-lg font-bold text-[#263F69]">
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
                      formik.setFieldValue("activityId", undefined);
                      setShowActivityModal(false);
                    }}
                  >
                    <Icon name="event-busy" size={24} color="#666" />
                    <Text className="text-base text-gray-800">
                      None
                    </Text>
                    {!formik.values.activityId && (
                      <Icon name="check" size={24} color="#263F69" style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                  {activities?.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                      onPress={() => {
                        formik.setFieldValue("activityId", activity.id);
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
                      {formik.values.activityId === activity.id && (
                        <Icon name="check" size={24} color="#263F69" style={{ marginLeft: "auto" }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showMemberModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowMemberModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50 p-5">
              <View className="bg-white rounded-[30px] shadow-lg w-full max-h-[80%] overflow-hidden">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                  <Text className="text-lg font-bold text-[#263F69]">
                    Select Member
                  </Text>
                  <TouchableOpacity onPress={() => setShowMemberModal(false)}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  <TouchableOpacity
                    className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                    onPress={() => {
                      formik.setFieldValue("memberId", "");
                      setShowMemberModal(false);
                    }}
                  >
                    <Icon name="person-outline" size={24} color="#666" />
                    <Text className="text-base text-gray-800">
                      None (No member assigned)
                    </Text>
                    {!formik.values.memberId && (
                      <Icon name="check" size={24} color="#263F69" style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                  {members.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                      onPress={() => {
                        formik.setFieldValue("memberId", member.id);
                        setShowMemberModal(false);
                      }}
                    >
                      <View className="w-8 h-8 rounded-full bg-[#263F69]/10 items-center justify-center">
                        <Text className="text-sm font-bold text-[#263F69]">
                          {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base text-gray-800 font-medium">
                          {member.name}
                        </Text>
                        {member.email && (
                          <Text className="text-xs text-gray-500">
                            {member.email}
                          </Text>
                        )}
                      </View>
                      {formik.values.memberId === member.id && (
                        <Icon name="check" size={24} color="#263F69" style={{ marginLeft: "auto" }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
  );
};

export default EditExpense;


