import React, { useState } from 'react';

const API_BASE_LOGIN = 'http://localhost:1000/api/insurer/manage';
const API_BASE_HOSPITAL = 'http://localhost:1000/api/hospital';

const PatientLoginPage = ({ onLoginSuccess }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Function to fetch latest hospital claim by customerId
  const fetchLatestHospitalClaimByCustomerId = async customerId => {
    try {
      const res = await fetch(`${API_BASE_HOSPITAL}/claims/latest-by-customer/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data._id) {
          return data;
        }
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch hospital claim:', err);
      return null;
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    console.log('Submitting login with ID:', id, 'Name:', name);

    try {
      const response = await fetch(`${API_BASE_LOGIN}/patient/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name }),
      });
      
      console.log('Login response:', response);

      if (response.ok) {
        const customerData = await response.json();
        const claim = await fetchLatestHospitalClaimByCustomerId(customerData._id);

        if (!claim) {
          setErrorMsg('No hospital claim found for your customer ID.');
          setLoading(false);
          return;
        }

        const normalizedPatient = {
          id: customerData._id,
          name: customerData.name,
          claimId: claim._id,
          claimData: claim,
        };

        console.log('Login successful - normalized patient data:', normalizedPatient);
        onLoginSuccess && onLoginSuccess(normalizedPatient);
      } else if (response.status === 401) {
        setErrorMsg('Invalid ID or Name.');
      } else if (response.status === 400) {
        setErrorMsg('Please enter a valid ObjectId.');
      } else {
        setErrorMsg('Invalid ID or Name.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Login failed. Please try again later.');
    }

    setLoading(false);
  };

  const services = [
    { icon: '❤️', name: 'Cardiac Sciences', description: 'Advanced heart care with experienced specialists' },
    { icon: '🧠', name: 'Neurosciences', description: 'Expert neurological diagnosis and treatment' },
    { icon: '🦴', name: 'Orthopedics', description: 'Bone and joint care with modern technology' },
    { icon: '👶', name: 'Obstetrics & Gynecology', description: 'Comprehensive women\'s health services' },
    { icon: '🚨', name: 'Emergency Medicine', description: '24/7 emergency care and trauma services' },
    { icon: '🤖', name: 'Robotic Surgery', description: 'Minimally invasive precision surgery' }
    
  ];

  const doctors = [
    { name: 'Dr. Prasanthi Bobbili', speciality: 'Cardiologist', experience: '15+ years', image: 'data:image/jpeg;base64,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' },
    { name: 'Dr. Sireesha Bobbili', speciality: 'Neurologist', experience: '12+ years', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSjhNErdY0bBlN28KirqjUYhik4SlORWm_XA&s' },
    { name: 'Dr. Satyanarayana Bobbili', speciality: 'Orthopedic Surgeon', experience: '18+ years', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSufazsKYutPW2s8879-bkVyg9Nh4-MOJXYnw&s' },
    { name: 'Dr. Durga Bhavani Bobbili', speciality: 'Gynecologist', experience: '10+ years', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZJfr8isw7BIVfzAM_7XRIx7qddbpGcUD0A&s' },
    { name: 'Dr. Vikram Singh', speciality: 'Emergency Physician', experience: '14+ years', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-WpTHKJ-VlbNFWG2RQwE4aHZ2cq3FfpvSkQ&s' },
    { name: 'Dr. Kavya Nair', speciality: 'General Surgeon', experience: '16+ years', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2Dn0oLz6MDWnNS6Tkf6AT-zQNdMQ9YF-Iqw&s' }
  ];

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        {/* Header Section */}
        <header style={styles.header}>
          <div style={styles.logoSection}>
            <div style={styles.oldLogo}>
              🏥 SPECIALIST<br />HOSPITAL
            </div>
            <span style={styles.arrow}>➡️</span>
            <div style={styles.newLogo}>
              <div style={styles.logoIcon}>B</div>
              <div>
                <div style={styles.logoText}>Bobbili's</div>
                <div style={styles.logoTextSub}>HOSPITAL</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Hero Section */}
        <main style={styles.mainContent}>
          <div style={styles.contentLeft}>
            <h1 style={styles.mainTitle}>24*7 Multispeciality Emergency Hospital in Vijayawada</h1>
            <p style={styles.subtitle}>In Case of Any Medical Emergency We are there to Serve You!</p>
            <a href="tel:+9191233456789" style={styles.phoneButton}>📞 +91 9123456789</a>
          </div>

          <div style={styles.loginCard}>
            <h2 style={styles.loginTitle}>Patient Login</h2>
            <div>
              <div style={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Health Card ID *"
                  value={id}
                  onChange={e => setId(e.target.value)}
                  required
                  style={styles.formInput}
                  autoComplete="off"
                />
              </div>

              <div style={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={styles.formInput}
                  autoComplete="off"
                />
              </div>

              {errorMsg && <p style={styles.errorMsg}>{errorMsg}</p>}

              <button onClick={handleSubmit} disabled={loading} style={styles.loginButton}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </main>

        {/* Services Section */}
        <section style={styles.servicesSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Our Multispecialty Services</h2>
            <p style={styles.sectionSubtitle}>Comprehensive healthcare with cutting-edge technology and experienced specialists</p>
          </div>
          
          <div style={styles.servicesGrid}>
            {services.map((service, index) => (
              <div key={index} style={styles.serviceCard}>
                <div style={styles.serviceIcon}>{service.icon}</div>
                <h3 style={styles.serviceName}>{service.name}</h3>
                <p style={styles.serviceDescription}>{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Doctors Section */}
        <section style={styles.doctorsSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Meet Our Expert Doctors</h2>
            <p style={styles.sectionSubtitle}>Experienced specialists dedicated to providing exceptional care</p>
          </div>
          
          <div style={styles.doctorsGrid}>
            {doctors.map((doctor, index) => (
              <div key={index} style={styles.doctorCard}>
                <img 
                  src={doctor.image} 
                  alt={doctor.name}
                  style={styles.doctorImage}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=2c5aa0&color=fff&size=120&rounded=true`;
                  }}
                />
                <div style={styles.doctorInfo}>
                  <h3 style={styles.doctorName}>{doctor.name}</h3>
                  <p style={styles.doctorSpeciality}>{doctor.speciality}</p>
                  <p style={styles.doctorExperience}>{doctor.experience}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.footerContent}>
            <div style={styles.footerSection}>
              <h3 style={styles.footerTitle}>Emergency Contact</h3>
              <p style={styles.footerText}>📞 +91 9123456789</p>
              <p style={styles.footerText}>🚨 24/7 Emergency Services</p>
            </div>
            <div style={styles.footerSection}>
              <h3 style={styles.footerTitle}>Location</h3>
              <p style={styles.footerText}>📍 Vijayawada  Andhra Pradesh</p>
              <p style={styles.footerText}>BenZ Circle</p>
            </div>
            <div style={styles.footerSection}>
              <h3 style={styles.footerTitle}>Services</h3>
              <p style={styles.footerText}>🏥 Multispecialty Care</p>
              <p style={styles.footerText}>🤖 Robotic Surgery</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const styles = {
  body: {
    fontFamily: "'Inter', 'Arial', sans-serif",
    background: 'linear-gradient(rgba(0, 150, 200, 0.85), rgba(135, 206, 235, 0.9)), url("https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    color: 'white',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: 20,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 15,
  },
  oldLogo: {
    background: 'white',
    padding: '15px 20px',
    borderRadius: 8,
    fontWeight: 'bold',
    color: '#2c5aa0',
    fontSize: 14,
    lineHeight: 1.2,
  },
  arrow: {
    fontSize: 24,
    color: '#fff',
  },
  newLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 60,
    height: 60,
    background: 'linear-gradient(135deg, #e91e63, #9c27b0)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 1,
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  logoTextSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: 60,
    alignItems: 'center',
    marginBottom: 80,
  },
  contentLeft: {
    maxWidth: 600,
  },
  mainTitle: {
    fontSize: 58,
    fontWeight: 'bold',
    lineHeight: 1.1,
    marginBottom: 30,
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 40,
    opacity: 0.95,
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
  },
  phoneButton: {
    background: 'linear-gradient(135deg, #e91e63, #ad1457)',
    color: 'white',
    padding: '18px 35px',
    borderRadius: 50,
    textDecoration: 'none',
    fontSize: 20,
    fontWeight: 'bold',
    display: 'inline-block',
    boxShadow: '0 4px 20px rgba(233, 30, 99, 0.4)',
    transition: 'transform 0.3s ease',
    cursor: 'pointer',
  },
  loginCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    padding: 40,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#2c5aa0',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 25,
  },
  formInput: {
    width: '100%',
    padding: 15,
    border: '2px solid #e0e0e0',
    borderRadius: 10,
    fontSize: 16,
    transition: 'border-color 0.3s ease',
    backgroundColor: 'white',
    color: '#333',
    outline: 'none',
    boxSizing: 'border-box',
  },
  errorMsg: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #2c5aa0, #1e3a8a)',
    color: 'white',
    padding: 15,
    border: 'none',
    borderRadius: 10,
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  servicesSection: {
    marginBottom: 80,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    padding: 60,
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: 50,
  },
  sectionTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 15,
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  sectionSubtitle: {
    fontSize: 18,
    opacity: 0.9,
    maxWidth: 600,
    margin: '0 auto',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 30,
  },
  serviceCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: 15,
    padding: 30,
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  },
  serviceIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'white',
  },
  serviceDescription: {
    fontSize: 16,
    opacity: 0.9,
    lineHeight: 1.5,
  },
  doctorsSection: {
    marginBottom: 80,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    padding: 60,
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  doctorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 30,
  },
  doctorCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: 15,
    padding: 30,
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.3s ease',
    cursor: 'pointer',
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: 20,
    border: '3px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  doctorInfo: {
    textAlign: 'center',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  doctorSpeciality: {
    fontSize: 16,
    color: '#e3f2fd',
    marginBottom: 5,
  },
  doctorExperience: {
    fontSize: 14,
    opacity: 0.8,
  },
  footer: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    borderRadius: 15,
    padding: 40,
    marginTop: 'auto',
  },
  footerContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 40,
  },
  footerSection: {
    textAlign: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'white',
  },
  footerText: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
};

export default PatientLoginPage;