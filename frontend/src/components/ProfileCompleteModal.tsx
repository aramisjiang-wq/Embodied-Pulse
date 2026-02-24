/**
 * 注册/登录后完善资料弹窗
 * 必填：身份、地域。组织名称为可选（个人无组织，仅高校/企业可填；填写组织名称后可从 L1 升级到 L3）
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal, Radio, Input, App, Select } from 'antd';
import { userApi } from '@/lib/api/user';
import { useAuthStore } from '@/store/authStore';

const IDENTITY_OPTIONS = [
  { value: 'university', label: '高校' },
  { value: 'enterprise', label: '企业' },
  { value: 'personal', label: '个人爱好' },
  { value: 'other', label: '其他' },
];

const REGION_OPTIONS = [
  { value: 'mainland_china', label: '中国大陆' },
  { value: 'hongkong_macao_taiwan', label: '中国港澳台' },
  { value: 'overseas', label: '海外' },
];

export default function ProfileCompleteModal() {
  const { user, setUser, isAuthenticated, hydrated } = useAuthStore();
  const { message } = App.useApp();
  const [identityType, setIdentityType] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.identityType) setIdentityType(user.identityType);
      if (user.region) setRegion(user.region);
      if (user.organizationName) setOrganizationName(user.organizationName);
    }
  }, [user?.id]);

  const needComplete =
    hydrated &&
    isAuthenticated &&
    user &&
    (user.identityType == null ||
      user.identityType === '' ||
      user.region == null ||
      user.region === '');

  const open = !!needComplete;

  const handleOk = async () => {
    if (!identityType?.trim()) {
      message.warning('请选择您的身份');
      return;
    }
    if (!region?.trim()) {
      message.warning('请选择地域');
      return;
    }
    setLoading(true);
    try {
      const updated = await userApi.updateProfile({
        identityType: identityType.trim(),
        region: region.trim(),
        organizationName: organizationName.trim() || undefined,
      });
      setUser(updated, false);
      message.success('保存成功' + (organizationName?.trim() ? '，已获得 300 积分奖励！' : ''));
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const showOrgHint = identityType === 'university' || identityType === 'enterprise';

  return (
    <Modal
      title="完善您的资料"
      open={open}
      onOk={handleOk}
      onCancel={() => {}}
      okText="保存"
      cancelButtonProps={{ style: { display: 'none' } }}
      closable={false}
      maskClosable={false}
      confirmLoading={loading}
      width={440}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>身份</div>
        <Radio.Group
          value={identityType}
          onChange={e => setIdentityType(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={IDENTITY_OPTIONS}
          style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 8 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>地域</div>
        <Select
          style={{ width: '100%' }}
          placeholder="请选择"
          value={region || undefined}
          onChange={setRegion}
          options={REGION_OPTIONS}
        />
      </div>

      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>
          组织名称 <span style={{ fontWeight: 400, color: '#8c8c8c' }}>（选填，个人可不填）</span>
        </div>
        <Input
          placeholder="请输入学校、公司或组织名称"
          value={organizationName}
          onChange={e => setOrganizationName(e.target.value)}
          maxLength={100}
          showCount
        />
        {showOrgHint && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#1677ff' }}>
            填写组织名称后，可获得 300 积分奖励，快速升级
          </div>
        )}
      </div>
    </Modal>
  );
}
