import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { Text, DataTable, useTheme, Checkbox } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { TravelPlan, ItineraryExpense } from "../../../../Travel/types/TravelDto";
import { useItineraryExpenses } from "../../../hooks/useExpense";
import { useTripMembers } from "../../../hooks/useTripMembers";
import { useMemberSplitBills, useSaveManyMemberSplitBillsMutation, useSaveMemberSplitBillMutation } from "../../../hooks/useMemberSplitBills";
import ExpenseCategoryIcon from "../../Forms/Expense/ExpenseCategoryIcon";

interface ExpensesTabProps {
  travelPlan: TravelPlan;
  onEditExpense?: (expense: ItineraryExpense) => void;
}


// Custom self-contained slider component utilizing pure JS gesture responders for Android and iOS compatibility
const CustomSlider = ({ value, onChange, disabled, colors }: { value: number; onChange: (val: number) => void; disabled?: boolean; colors: any }) => {
  const [sliderWidth, setSliderWidth] = useState(0);

  const handleTouch = (evt: any) => {
    if (disabled || sliderWidth <= 0) return;
    const { locationX } = evt.nativeEvent;
    const pct = Math.max(0, Math.min(100, Math.round((locationX / sliderWidth) * 100)));
    onChange(pct);
  };

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Split Share</Text>
        <Text style={{ color: disabled ? '#999' : colors.primary }} className="text-sm font-bold">
          {value.toFixed(0)}%
        </Text>
      </View>
      <View 
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        style={{ 
          height: 32, 
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1 
        }}
        className="w-full relative"
      >
        {/* Track Background */}
        <View className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          {/* Active Progress */}
          <View 
            style={{ 
              width: `${value}%`, 
              backgroundColor: disabled ? '#9E9E9E' : colors.primary 
            }} 
            className="h-full rounded-full"
          />
        </View>
        
        {/* Thumb */}
        <View 
          pointerEvents="none"
          style={{ 
            left: `${value}%`, 
            marginLeft: -10,
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: disabled ? '#9E9E9E' : colors.primary,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 3
          }}
        />
      </View>
    </View>
  );
};

const ExpensesTab = ({ travelPlan, onEditExpense }: ExpensesTabProps) => {
  const { colors } = useTheme();
  
  // UI and Local states
  const [splitEqually, setSplitEqually] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMemberSplit, setSelectedMemberSplit] = useState<any | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentType, setPaymentType] = useState("Cash");
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [percentageShare, setPercentageShare] = useState(0);

  // Queries
  const { data: expenses = [], isLoading: isLoadingExpenses } = useItineraryExpenses(travelPlan.travel.id || "");
  const { data: members = [], isLoading: isLoadingMembers } = useTripMembers(travelPlan.travel.id || "");
  const { data: splits = [], isLoading: isLoadingSplits } = useMemberSplitBills(travelPlan.travel.id || "");

  // Mutations
  const { mutate: saveManySplits } = useSaveManyMemberSplitBillsMutation(travelPlan.travel.id || "");
  const { mutate: saveSingleSplit } = useSaveMemberSplitBillMutation();

  // Statistics Calculations
  const totalExpense = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const totalSplitBill = expenses?.reduce((sum, exp) => sum + (exp.isIncludeInBill !== false ? exp.amount : 0), 0) || 0;

  // Build the live combined member splitting allocations list
  const memberSplits = members.map((member) => {
    const splitRecord = splits.find((s) => String(s.memberId) === String(member.id));
    
    let currentPercentageShare = 0;
    let owesAmount = 0;
    let memberIsPaid = false;
    let memberPaymentType = "";
    let memberPaidDate = null;
    let memberNotes = "";

    if (members.length > 0) {
      if (splitEqually) {
        currentPercentageShare = 100 / members.length;
        owesAmount = totalSplitBill / members.length;
        memberIsPaid = splitRecord ? splitRecord.isPaid : false;
        memberPaymentType = splitRecord?.paymentType || "Cash";
        memberPaidDate = splitRecord?.paidDate || null;
        memberNotes = splitRecord?.notes || "";
      } else {
        currentPercentageShare = splitRecord ? splitRecord.percentageShare : 0;
        owesAmount = splitRecord ? splitRecord.owesAmount : 0;
        memberIsPaid = splitRecord ? splitRecord.isPaid : false;
        memberPaymentType = splitRecord?.paymentType || "Cash";
        memberPaidDate = splitRecord?.paidDate || null;
        memberNotes = splitRecord?.notes || "";
      }
    }

    return {
      memberId: member.id,
      name: member.name,
      email: member.email,
      percentageShare: currentPercentageShare,
      owesAmount,
      isPaid: memberIsPaid,
      paymentType: memberPaymentType,
      paidDate: memberPaidDate,
      notes: memberNotes,
      splitRecordId: splitRecord?.id,
    };
  });

  // Calculate overall collections
  const totalCollected = memberSplits.reduce((sum, s) => sum + (s.isPaid ? s.owesAmount : 0), 0);
  const totalRemaining = totalSplitBill - totalCollected;

  // Auto-sync Equal Splits to DB to preserve queries integrity
  useEffect(() => {
    if (splitEqually && members.length > 0 && totalSplitBill >= 0 && !isLoadingSplits) {
      const needsSync = members.some((m) => {
        const splitRecord = splits.find((s) => String(s.memberId) === String(m.id));
        const expectedOwes = totalSplitBill / members.length;
        const expectedPercent = 100 / members.length;
        
        if (!splitRecord) return true;
        return Math.abs(splitRecord.owesAmount - expectedOwes) > 0.01 || 
               Math.abs(splitRecord.percentageShare - expectedPercent) > 0.01;
      });

      if (needsSync) {
        const equalSplits = members.map((m) => {
          const splitRecord = splits.find((s) => String(s.memberId) === String(m.id));
          return {
            travelId: travelPlan.travel.id || "",
            memberId: m.id || "",
            owesAmount: totalSplitBill / members.length,
            percentageShare: 100 / members.length,
            isPaid: splitRecord ? splitRecord.isPaid : false,
            paymentType: splitRecord?.paymentType || "Cash",
            paidDate: splitRecord?.paidDate ? new Date(splitRecord.paidDate).getTime() : undefined,
            notes: splitRecord?.notes || undefined,
          };
        });
        saveManySplits(equalSplits);
      }
    }
  }, [splitEqually, members.length, totalSplitBill, splits, isLoadingSplits]);

  // Log Payments / Custom Split Shares in Modal
  const handleOpenPaymentModal = (split: any) => {
    setSelectedMemberSplit(split);
    setIsPaid(split.isPaid);
    setPaymentType(split.paymentType || "Cash");
    setNotes(split.notes || "");
    setPercentageShare(split.percentageShare || 0);
    setPaymentModalVisible(true);
  };

  const handleSavePayment = () => {
    if (!selectedMemberSplit) return;

    const finalPercent = splitEqually ? (100 / members.length) : percentageShare;
    const finalOwes = totalSplitBill * (finalPercent / 100);

    saveSingleSplit(
      {
        id: selectedMemberSplit.splitRecordId,
        travelId: travelPlan.travel.id || "",
        memberId: selectedMemberSplit.memberId,
        owesAmount: finalOwes,
        percentageShare: finalPercent,
        isPaid: isPaid,
        paymentType: paymentType,
        paidDate: isPaid ? (selectedMemberSplit.paidDate || new Date().getTime()) : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPaymentModalVisible(false);
          setSelectedMemberSplit(null);
        },
        onError: (err) => {
          Alert.alert("Error", "Failed to save details. Please try again.");
          console.error(err);
        },
      }
    );
  };

  if (isLoadingExpenses || isLoadingMembers || isLoadingSplits) {
    return (
      <View className="items-center justify-center py-10 bg-gray-100 flex-1">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const sortedExpenses = expenses ? [...expenses].sort((a, b) => {
    const timeA = new Date(a.dateTime || 0).getTime();
    const timeB = new Date(b.dateTime || 0).getTime();
    return timeB - timeA;
  }) : [];

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ padding: 16 }}>
      
      {/* Redesigned Combined Dashboard Card */}
      <View className="bg-white rounded-[24px] border border-gray-200/60 shadow-sm p-5 mb-5 overflow-hidden">
        
        {/* Highlighted Primary Stat: Total Expense */}
        <View className="items-center py-1 mb-4">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Expense</Text>
          <Text 
            style={{ color: colors.primary }}
            className="text-4xl font-extrabold mt-1 tracking-tight"
          >
            ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Sub-stats Row (Split Bill, Collected, Remaining) */}
        <View className="flex-row justify-between bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mb-4 gap-2">
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider text-center">Split Bill</Text>
            <Text className="text-sm font-extrabold text-gray-800 mt-1 text-center">
              ${totalSplitBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View className="w-[1px] bg-gray-200" />

          <View className="flex-1 items-center">
            <Text className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider text-center">Collected</Text>
            <Text className="text-sm font-extrabold text-emerald-600 mt-1 text-center">
              ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View className="w-[1px] bg-gray-200" />

          <View className="flex-1 items-center">
            <Text className="text-amber-600 text-[10px] font-bold uppercase tracking-wider text-center">Remaining</Text>
            <Text className="text-sm font-extrabold text-amber-600 mt-1 text-center">
              ${totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Checkbox: Split Bill Equally */}
        <View className="flex-row items-center mb-2 mt-1 ml-1">
          <Checkbox
            status={splitEqually ? 'checked' : 'unchecked'}
            onPress={() => setSplitEqually(!splitEqually)}
            color={colors.primary}
          />
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setSplitEqually(!splitEqually)}
            accessibilityRole="checkbox"
          >
            <Text className="text-sm font-semibold text-gray-700 ml-1">
              Split bill equally among members
            </Text>
          </TouchableOpacity>
        </View>

        {/* Line Separator & Expand Toggle Button */}
        <View className="h-[1px] bg-gray-200/80 my-3" />
        
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex-row items-center justify-between py-1 px-1"
          accessibilityRole="button"
          accessibilityLabel="Toggle members list"
        >
          <View className="flex-row items-center gap-2">
            <Icon name="people" size={20} color={colors.primary} />
            <Text className="text-sm font-bold text-gray-700">
              Members Split Allocation ({memberSplits.length})
            </Text>
          </View>
          <Icon 
            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>

        {/* Collapsible Members Allocation List/Table */}
        {isExpanded && (
          <View className="mt-4">
            {memberSplits.length > 0 ? (
              <View className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/20">
                {memberSplits.map((split, index) => {
                  const firstLetter = split.name.trim().charAt(0).toUpperCase();
                  const isLast = index === memberSplits.length - 1;

                  return (
                    <TouchableOpacity
                      key={split.memberId}
                      onPress={() => handleOpenPaymentModal(split)}
                      className={`flex-row items-center p-3 justify-between ${!isLast ? 'border-b border-gray-100' : ''}`}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                    >
                      <View className="flex-row items-center flex-1 pr-4">
                        {/* Circle Avatar */}
                        <View 
                          style={{ backgroundColor: colors.primaryContainer }}
                          className="w-8 h-8 rounded-full justify-center items-center mr-2.5"
                        >
                          <Text 
                            style={{ color: colors.onPrimaryContainer }}
                            className="text-sm font-bold"
                          >
                            {firstLetter}
                          </Text>
                        </View>

                        {/* Member Details */}
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-gray-800" numberOfLines={1}>{split.name}</Text>
                          <Text className="text-[10px] text-gray-500 mt-0.5 font-semibold">
                            Owes: ${split.owesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        {/* Percentage Share Display */}
                        <View className="bg-gray-100 rounded-lg px-2 py-0.5">
                          <Text className="text-[10px] font-bold text-gray-600">
                            {split.percentageShare.toFixed(0)}%
                          </Text>
                        </View>

                        {/* Paid/Unpaid Badge */}
                        <View className={`px-2 py-0.5 rounded-full ${split.isPaid ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                          <Text className={`text-[9px] font-bold ${split.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {split.isPaid ? 'Paid' : 'Unpaid'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View className="bg-white rounded-[24px] border border-dashed border-gray-200 p-6 items-center justify-center">
                <Icon name="people-outline" size={32} color="#BDBDBD" />
                <Text className="text-gray-500 text-xs mt-2 text-center">
                  No members added to this trip yet. Go to Edit Trip and open the Members tab to add some!
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Expenses Table UI */}
      <View className="mb-4">
        <Text className="text-xs font-semibold tracking-wider uppercase mb-3 text-gray-500">
          Expenses Details
        </Text>
        <View className="bg-white rounded-[24px] overflow-hidden border border-gray-200/50 shadow-sm mb-4">
          <DataTable>
            <DataTable.Header className="bg-gray-50/50">
              <DataTable.Title style={{ maxWidth: 45 }}>{""}</DataTable.Title>
              <DataTable.Title textStyle={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '600' }}>Item</DataTable.Title>
              <DataTable.Title numeric textStyle={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '600' }}>Date</DataTable.Title>
              <DataTable.Title numeric textStyle={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '600' }}>Amount</DataTable.Title>
              <DataTable.Title style={{ maxWidth: 45 }} numeric textStyle={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '600' }}>Split</DataTable.Title>
            </DataTable.Header>

            {sortedExpenses.length > 0 ? (
              sortedExpenses.map((expense, index) => (
                <DataTable.Row 
                  key={expense.id || index} 
                  className="border-b-0"
                  onPress={() => onEditExpense?.(expense)}
                >
                  <DataTable.Cell style={{ maxWidth: 45 }}>
                     <ExpenseCategoryIcon category={expense.expenseCategory} size={22} color={colors.primary} />
                  </DataTable.Cell>
                  <DataTable.Cell textStyle={{ fontSize: 13, fontWeight: '500', color: '#1A1A1A' }}>
                    {expense.title}
                  </DataTable.Cell>
                  <DataTable.Cell numeric textStyle={{ fontSize: 11, color: colors.secondary }}>
                    {(() => {
                      const d = new Date(expense.dateTime);
                      return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) + 
                             " " + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    })()}
                  </DataTable.Cell>
                  <DataTable.Cell numeric textStyle={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                    {expense.currency || '$'}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </DataTable.Cell>
                  <DataTable.Cell style={{ maxWidth: 45 }} numeric>
                    <Icon 
                      name={expense.isIncludeInBill !== false ? "people" : "person"} 
                      size={18} 
                      color={expense.isIncludeInBill !== false ? "#16A34A" : "#666"} 
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              ))
            ) : (
              <View className="py-10 items-center">
                <Text className="text-gray-400 text-sm">No expenses recorded for this trip.</Text>
              </View>
            )}

            {expenses && expenses.length > 0 && (
              <DataTable.Row className="bg-gray-50/30 border-t border-gray-100">
                <DataTable.Cell style={{ maxWidth: 45 }}>{""}</DataTable.Cell>
                <DataTable.Cell textStyle={{ fontWeight: '700', color: '#1A1A1A' }}>Total</DataTable.Cell>
                <DataTable.Cell numeric textStyle={{ fontWeight: '800', color: colors.primary, fontSize: 15 }}>
                  ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </DataTable.Cell>
                <DataTable.Cell style={{ maxWidth: 45 }} numeric>{""}</DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </View>
      </View>

      {/* Redesigned Payment & Share Adjustment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center p-5" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
        
          <View 
            style={{ width: '100%', maxWidth: 360 }}
            className="bg-white rounded-[30px] shadow-lg p-6 overflow-hidden"
          >
            
            {/* Modal Header */}
            <View className="flex-row justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <Text className="text-base font-bold text-gray-800">
                Edit Member Split Share
              </Text>
              <TouchableOpacity 
                onPress={() => setPaymentModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedMemberSplit && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Member Info */}
                <Text className="text-base font-bold text-gray-800 mb-0.5">
                  {selectedMemberSplit.name}
                </Text>
                <Text className="text-xs text-gray-500 font-semibold mb-4">
                  Owes: ${((totalSplitBill * (splitEqually ? (100 / members.length) : percentageShare)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

                {/* Notice if Equal Splitting is Locked */}
                {splitEqually && (
                  <View className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl mb-4">
                    <Text className="text-[10px] text-amber-700 font-medium leading-4">
                      ⚠ Uncheck "Split bill equally" in the card to unlock custom percentage slider.
                    </Text>
                  </View>
                )}

                {/* Percentage Share Slider */}
                <CustomSlider 
                  value={splitEqually ? (100 / members.length) : percentageShare}
                  onChange={setPercentageShare}
                  disabled={splitEqually}
                  colors={colors}
                />

                {/* Toggle Paid Status Checkbox */}
                <View className="flex-row items-center mb-5 mt-1 -ml-2">
                  <Checkbox
                    status={isPaid ? 'checked' : 'unchecked'}
                    onPress={() => setIsPaid(!isPaid)}
                    color={colors.primary}
                  />
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    onPress={() => setIsPaid(!isPaid)}
                    accessibilityRole="checkbox"
                  >
                    <Text className="text-sm font-semibold text-gray-700 ml-1">
                      Mark as Paid
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Payment Method Selector (Always Editable as requested) */}
                <View className="mb-5">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Payment Method
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["Cash", "Venmo", "Bank Transfer", "Others"].map((type) => {
                      const isSelected = paymentType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setPaymentType(type)}
                          style={{ 
                            backgroundColor: isSelected ? colors.primary : '#F2F4F7',
                            borderColor: isSelected ? colors.primary : '#E0E0E0'
                          }}
                          className="px-3 py-1.5 border rounded-full"
                          accessibilityRole="button"
                        >
                          <Text 
                            style={{ color: isSelected ? '#FFF' : '#666' }}
                            className="text-xs font-semibold"
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Custom Notes / Memo Input */}
                <View className="mb-6">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Notes / Memo
                  </Text>
                  <TextInput
                    placeholder="Add details, e.g. Request sent, Paid cash"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={2}
                    placeholderTextColor="#A0A0A0"
                    style={{ 
                      minHeight: 50,
                      textAlignVertical: 'top'
                    }}
                    className="border border-gray-200 rounded-[12px] p-3 text-xs bg-gray-50/50 text-gray-800"
                  />
                </View>

                {/* Save Details Button */}
                <TouchableOpacity
                  onPress={handleSavePayment}
                  style={{ backgroundColor: colors.primary }}
                  className="p-4 rounded-[16px] items-center justify-center shadow-sm"
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text className="text-white text-base font-semibold">
                    Save Details
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ExpensesTab;
