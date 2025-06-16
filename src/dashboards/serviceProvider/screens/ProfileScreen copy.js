import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import {colors} from '../../../utils/colors';
import ProfileImage from '../../../assets/images/profile1.jpeg';
import ProfileImage2 from '../../../assets/images/profile2.jpeg';
import ProfileImage3 from '../../../assets/images/profile3.jpeg';
import ProfileImage4 from '../../../assets/images/profile4.jpeg';
import ResidentialPlumbingImage from '../../../assets/images/ResidentialPlumbing.jpg';
import BathroomRenovationImage from '../../../assets/images/BathroomRenovation.jpg';
import CommercialPlumbingImage from '../../../assets/images/CommercialPlumbing.jpg';
import DrainageServicesImage from '../../../assets/images/DrainageServices.jpg';
import EmergencyRepairsImage from '../../../assets/images/EmergencyRepairs.jpeg';
import KitchenPlumbingImage from '../../../assets/images/KitchenPlumbing.jpg';
import LeakDetectionImage from '../../../assets/images/LeakDetection.jpg';
import PipeInstallationImage from '../../../assets/images/PipeInstallation.jpg';
import WaterHeaterServicesImage from '../../../assets/images/WaterHeaterServices.jpg';

const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('Personal');

  // Sample data
  const userData = {
    personal: {
      name: 'Ahmed Khan',
      profession: 'Professional Plumber',
      location: 'Lahore, Pakistan',
      rating: 4.8,
      jobsCompleted: 145,
      completionRate: '98%',
      experience: [
        {
          title: 'Senior Plumber',
          company: 'ABC Home Services',
          period: 'Jan 2020 - Present',
        },
        {
          title: 'Plumbing Technician',
          company: 'XYZ Plumbing',
          period: 'May 2016 - Dec 2019',
        },
      ],
      skills: [
        'Plumbing',
        'Pipe Fitting',
        'Water Systems',
        'Bathroom Fixtures',
        'Kitchen Plumbing',
        'Leak Repair',
        'Water Heaters',
        'Drainage Systems',
      ],
      reviews: [
        {
          id: 1,
          name: 'Samia Khan',
          image: ProfileImage2,
          time: '2 weeks ago',
          text: 'Ahmed did an excellent job fixing our kitchen sink. He was prompt, professional, and cleaned up everything after completing the work. Highly recommended!',
          service: 'Kitchen Sink Installation',
        },
        {
          id: 2,
          name: 'Zain Malik',
          image: ProfileImage3,
          time: '1 month ago',
          text: 'Very professional service. Ahmed is knowledgeable and efficient. He fixed our bathroom plumbing issues in no time. Fair pricing and great communication throughout.',
          service: 'Bathroom Plumbing Repair',
        },
      ],
    },
    company: {
      name: 'Water Solutions Ltd',
      description: 'Professional Plumbing & Water System Services',
      established: 'Established 2015',
      location: 'Lahore, Pakistan',
      about:
        'Water Solutions Ltd is a professional plumbing company specializing in residential and commercial plumbing services. With over 8 years of experience, we provide high-quality workmanship for all water system installations, repairs, and maintenance.',
      teamMembers: 12,
      projectsCompleted: '750+',
      locations: 4,
      averageRating: 4.9,
      services: [
        'Residential Plumbing',
        'Commercial Plumbing',
        'Pipe Installation',
        'Kitchen Plumbing',
        'Leak Detection',
        'Water Heater Services',
        'Bathroom Renovation',
        'Drainage Services',
        'Emergency Repairs',
      ],
      portfolio: [
        ResidentialPlumbingImage,
        CommercialPlumbingImage,
        PipeInstallationImage,
        KitchenPlumbingImage,
        LeakDetectionImage,
        WaterHeaterServicesImage,
        BathroomRenovationImage,
        DrainageServicesImage,
        EmergencyRepairsImage,
      ],
      team: [
        {
          name: 'Ali Hassan',
          role: 'Founder & Lead Plumber',
          image: ProfileImage,
        },
        {
          name: 'Faisal Mehmood',
          role: 'Senior Plumber',
          image: ProfileImage2,
        },
        {
          name: 'Samia Khan',
          role: 'Operations Manager',
          image: ProfileImage3,
        },
        {
          name: 'Hassan Ali',
          role: 'Technical Lead',
          image: ProfileImage4,
        },
      ],
      contactInfo: {
        phone: '+92-340-ABCHXOI',
        email: 'support@archxoi.com',
        address: '123 Main Street, DHA Phase 5, Lahore, Pakistan',
      },
    },
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${
          activeTab === 'Personal'
            ? userData.personal.name
            : userData.company.name
        } on Fixrr App!`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleFollow = () => {
    // Handle follow action
    console.log('Follow button pressed');
  };

  const handleMessage = () => {
    // Handle message action
    console.log('Message button pressed');
  };

  const renderPersonalTab = () => {
    const {personal} = userData;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image source={ProfileImage} style={styles.profileImage} />
          <Text style={styles.profileName}>{personal.name}</Text>
          <Text style={styles.profileProfession}>{personal.profession}</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{personal.location}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessage}>
            <Text style={styles.messageButtonIcon}>✉️</Text>
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{personal.jobsCompleted}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{personal.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{personal.completionRate}</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚙️</Text>
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>

          {personal.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <View style={styles.experienceDot} />
              <View style={styles.experienceContent}>
                <Text style={styles.experienceTitle}>{exp.title}</Text>
                <Text style={styles.experienceCompany}>{exp.company}</Text>
                <Text style={styles.experiencePeriod}>{exp.period}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🛠️</Text>
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>

          <View style={styles.skillsContainer}>
            {personal.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⭐</Text>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
          </View>

          {personal.reviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={review.image} style={styles.reviewerImage} />
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <Text style={styles.reviewTime}>{review.time}</Text>
                </View>
              </View>

              <Text style={styles.reviewText}>{review.text}</Text>

              <View style={styles.reviewServiceTag}>
                <Text style={styles.reviewServiceText}>{review.service}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderCompanyTab = () => {
    const {company} = userData;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image source={ProfileImage} style={styles.profileImage} />
          <Text style={styles.profileName}>{company.name}</Text>
          <Text style={styles.profileProfession}>{company.description}</Text>
          <View style={styles.companyInfoRow}>
            <Text style={styles.companyEstablished}>{company.established}</Text>
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{company.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.companyAboutSection}>
          <Text style={styles.companyAboutText}>{company.about}</Text>
        </View>

        <View style={styles.companyStatsSection}>
          <View style={styles.companyStatBox}>
            <View style={styles.companyStatIcon}>
              <Text style={styles.companyStatIconText}>👥</Text>
            </View>
            <View style={styles.companyStatContent}>
              <Text style={styles.companyStatTitle}>Team Members</Text>
              <Text style={styles.companyStatValue}>{company.teamMembers}</Text>
            </View>
          </View>

          <View style={styles.companyStatBox}>
            <View style={styles.companyStatIcon}>
              <Text style={styles.companyStatIconText}>✅</Text>
            </View>
            <View style={styles.companyStatContent}>
              <Text style={styles.companyStatTitle}>Projects Completed</Text>
              <Text style={styles.companyStatValue}>
                {company.projectsCompleted}
              </Text>
            </View>
          </View>

          <View style={styles.companyStatBox}>
            <View style={styles.companyStatIcon}>
              <Text style={styles.companyStatIconText}>📍</Text>
            </View>
            <View style={styles.companyStatContent}>
              <Text style={styles.companyStatTitle}>Locations</Text>
              <Text style={styles.companyStatValue}>{company.locations}</Text>
            </View>
          </View>

          <View style={styles.companyStatBox}>
            <View style={styles.companyStatIcon}>
              <Text style={styles.companyStatIconText}>⭐</Text>
            </View>
            <View style={styles.companyStatContent}>
              <Text style={styles.companyStatTitle}>Average Rating</Text>
              <Text style={styles.companyStatValue}>
                {company.averageRating}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔧</Text>
            <Text style={styles.sectionTitle}>Services</Text>
          </View>

          <View style={styles.servicesContainer}>
            {company.services.map((service, index) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🖼️</Text>
            <Text style={styles.sectionTitle}>Portfolio</Text>
          </View>

          <View style={styles.portfolioGrid}>
            {company.portfolio.map((image, index) => (
              <View key={index} style={styles.portfolioItem}>
                <Image source={image} style={styles.portfolioImage} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👥</Text>
            <Text style={styles.sectionTitle}>Team</Text>
          </View>

          <View style={styles.teamContainer}>
            {company.team.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <Image source={member.image} style={styles.teamMemberImage} />
                <Text style={styles.teamMemberName}>{member.name}</Text>
                <Text style={styles.teamMemberRole}>{member.role}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📞</Text>
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <View style={styles.contactContainer}>
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>📱</Text>
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>
                  {company.contactInfo.phone}
                </Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>✉️</Text>
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>
                  {company.contactInfo.email}
                </Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>🏢</Text>
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Main Office</Text>
                <Text style={styles.contactValue}>
                  {company.contactInfo.address}
                </Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Text style={styles.contactIconText}>📧</Text>
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>
                  {company.contactInfo.email}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Text style={styles.headerButtonText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Personal' && styles.activeTab]}
          onPress={() => setActiveTab('Personal')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'Personal' && styles.activeTabText,
            ]}>
            Personal
          </Text>
          {activeTab === 'Personal' && (
            <View style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Company' && styles.activeTab]}
          onPress={() => setActiveTab('Company')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'Company' && styles.activeTabText,
            ]}>
            Company
          </Text>
          {activeTab === 'Company' && (
            <View style={styles.activeTabIndicator} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'Personal' ? renderPersonalTab() : renderCompanyTab()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  headerButtonText: {
    fontSize: 20,
    color: colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.splashGreen,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '30%',
    backgroundColor: colors.splashGreen,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileProfession: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 10,
  },
  messageButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  followButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.background,
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  experienceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.splashGreen,
    marginTop: 4,
    marginRight: 12,
  },
  experienceContent: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  experienceCompany: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  experiencePeriod: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 13,
    color: colors.text,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  reviewerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  reviewTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reviewText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewServiceTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewServiceText: {
    fontSize: 12,
    color: colors.text,
  },
  companyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  companyEstablished: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  companyAboutSection: {
    backgroundColor: colors.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  companyAboutText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  companyStatsSection: {
    backgroundColor: colors.background,
    padding: 16,
    marginBottom: 8,
  },
  companyStatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyStatIconText: {
    fontSize: 16,
  },
  companyStatContent: {
    flex: 1,
  },
  companyStatTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  companyStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 13,
    color: colors.text,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  portfolioItem: {
    width: '33.33%',
    padding: 4,
  },
  portfolioImage: {
    width: '100%',
    height: 100,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  teamContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  teamMember: {
    width: '50%',
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  teamMemberImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  teamMemberRole: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contactContainer: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactIconText: {
    fontSize: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: colors.text,
  },
});

export default ProfileScreen;
