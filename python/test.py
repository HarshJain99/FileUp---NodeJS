import sys
import cv2

img = sys.argv[1];
imagePath = "C:\\Users\\Harsh\\Desktop\\nodejs\\uploads\\" + img
cascPath = "C:\\Users\\Harsh\\Desktop\\nodejs\\python\\haarcascade_frontalface_default.xml"

faceCascade = cv2.CascadeClassifier(cascPath)
image = cv2.imread(imagePath)

########################################
image = cv2.resize(image, (1360, 1080))
########################################

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

faces = faceCascade.detectMultiScale(
    gray,
    scaleFactor=1.25,
    minNeighbors=5,
    minSize=(30, 30),
    flags = cv2.CASCADE_SCALE_IMAGE
)
#print("Found {0} faces!".format(len(faces)))

for (x, y, w, h) in faces:
    cv2.rectangle(image, (x, y), (x+w, y+h), (255, 255, 255), 2)

#cv2.imshow("Faces found", image)
#cv2.resizeWindow("Faces found", 600,600)
#cv2.waitKey(0)
img = "C:\\Users\\Harsh\\Desktop\\nodejs\\modified\\" + img;
cv2.imwrite( img , image);

print(len(faces), img)
sys.stdout.flush()
