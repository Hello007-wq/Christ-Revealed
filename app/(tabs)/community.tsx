import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import { MOCK_COMMUNITY_POSTS, MOCK_PRAYER_REQUESTS } from '@/data/mockData';
import Card from '@/components/Card';
import CustomModal from '@/components/CustomModal';
import { MessageCircle, Heart, Send, Plus } from 'lucide-react-native';

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<'discussions' | 'prayer' | 'testimonies'>('discussions');
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  const filteredPosts = MOCK_COMMUNITY_POSTS.filter((post) => {
    if (activeTab === 'discussions') return post.type === 'discussion';
    if (activeTab === 'testimonies') return post.type === 'testimony';
    return false;
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discussions' && styles.activeTab]}
          onPress={() => setActiveTab('discussions')}
        >
          <Text style={[styles.tabText, activeTab === 'discussions' && styles.activeTabText]}>
            Discussions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prayer' && styles.activeTab]}
          onPress={() => setActiveTab('prayer')}
        >
          <Text style={[styles.tabText, activeTab === 'prayer' && styles.activeTabText]}>
            Prayer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'testimonies' && styles.activeTab]}
          onPress={() => setActiveTab('testimonies')}
        >
          <Text style={[styles.tabText, activeTab === 'testimonies' && styles.activeTabText]}>
            Testimonies
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'prayer' ? (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>Submit Prayer Request</Text>
            </TouchableOpacity>

            {MOCK_PRAYER_REQUESTS.map((request) => (
              <Card key={request.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.author}>{request.author}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(request.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.content}>{request.request}</Text>
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Heart size={18} color={COLORS.error} />
                    <Text style={styles.actionText}>{request.prayers} praying</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>
                {activeTab === 'discussions' ? 'Start Discussion' : 'Share Testimony'}
              </Text>
            </TouchableOpacity>

            {filteredPosts.map((post) => (
              <Card key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.author}>{post.author}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(post.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.content}>{post.content}</Text>
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={18} color={COLORS.primary} />
                    <Text style={styles.actionText}>{post.replies} replies</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={
          activeTab === 'discussions'
            ? 'New Discussion'
            : activeTab === 'prayer'
            ? 'Prayer Request'
            : 'Share Testimony'
        }
      >
        <TextInput
          style={styles.textArea}
          value={newPostContent}
          onChangeText={setNewPostContent}
          placeholder="Write your message..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => {
            setNewPostContent('');
            setModalVisible(false);
          }}
        >
          <Send size={20} color={COLORS.white} />
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.accent,
  },
  tabText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.gray,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
  },
  postCard: {
    marginBottom: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  author: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timestamp: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  content: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.gray,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONTS.sizes.medium,
    marginBottom: SPACING.lg,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '700',
  },
});
